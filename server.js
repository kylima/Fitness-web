const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const db = require('./config/db');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'apex_fit_secure_session_token_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24-Hour lifetime allocation
}));

/* View Template Routers */
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'homepage.html')));
app.get('/auth', (req, res) => res.sendFile(path.join(__dirname, 'views', 'form.html')));
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) return res.redirect('/auth');
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

/* Authentication Core Systems API endpoints */
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, phone, password, role } = req.body;
    try {
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: 'Email already mapped to an active account' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute(
            'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, hashedPassword, role]
        );
        res.status(201).json({ message: 'Registration succeeded! Booting Access portal...' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ? AND role = ?', [email, role]);
        if (users.length === 0) return res.status(400).json({ error: 'User account records not discovered matching criteria' });

        const user = users[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: 'Verification credentials match violation' });

        req.session.userId = user.id;
        req.session.userName = user.name;
        req.session.userRole = user.role;
        req.session.userPhone = user.phone;

        res.json({ message: 'Authentication verified!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* Retrieve Active Session Data (Includes Phone for Payments) */
app.get('/api/user/session', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized profile state' });
    res.json({ 
        name: req.session.userName, 
        role: req.session.userRole,
        phone: req.session.userPhone 
    });
});

/* Admin Analytics API Endpoint */
app.get('/api/admin/metrics', async (req, res) => {
    if (!req.session.userId || req.session.userRole !== 'employee') {
        return res.status(403).json({ error: 'Privilege authorization rejected' });
    }
    try {
        const [[userCount]] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "client"');
        const [[revenueSum]] = await db.execute('SELECT SUM(amount) as total FROM payments WHERE status = "completed"');
        res.json({
            totalUsers: userCount.count,
            totalRevenue: revenueSum.total || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* Helper function to generate Safaricom OAuth Access Token */
async function getDarajaToken() {
    const consumerKey = "9ezWxoMnOH1uHhApKZZ9D7nbBzSroAP5vuqs6invV4XxNjMM"; 
    const consumerSecret = "e4K4gr9uXbaXxXQb3Okc0aXE8GNCAJ81An8n81AJy8PWRinB5c8Kyw3YsqQ0U7XD"; 
    
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    try {
        const response = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            { headers: { Authorization: `Basic ${auth}` } }
        );
        return response.data.access_token;
    } catch (error) {
        console.error("Failed to generate Daraja token:", error.message);
        throw error;
    }
}

/* The Unified M-Pesa STK Push Payment Endpoint */
app.post('/api/payment/stkpush', async (req, res) => {
    try {
        let { phone, amount } = req.body;
        
        if (!phone) {
            return res.status(400).json({ success: false, message: "Phone number is missing from user payload." });
        }
        
        if (!amount) amount = 3000; // Apex Fit monthly subscription fee

        // Clean up the phone number to match Safaricom standard (2547XXXXXXXX)
        let formattedPhone = phone.trim().replace(/\s+/g, '');
        if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);
        if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
        if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) formattedPhone = '254' + formattedPhone;

        console.log(`Initiating Daraja STK Push for ${formattedPhone}, Amount: KES ${amount}`);

        const token = await getDarajaToken();
        const shortCode = "174379"; 
        const passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"; 
        
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

        const darajaResponse = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            {
                "BusinessShortCode": shortCode,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": amount,
                "PartyA": formattedPhone,
                "PartyB": shortCode,
                "PhoneNumber": formattedPhone,
                "CallBackURL": "https://example.com/callback", 
                "AccountReference": "ApexFitGym",
                "TransactionDesc": "Membership Enrollment"
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        console.log("Safaricom API Response Success:", darajaResponse.data);
        return res.status(200).json({
            success: true,
            message: "STK Push sent successfully!",
            checkoutRequestID: darajaResponse.data.CheckoutRequestID
        });

    } catch (error) {
        console.error("❌ DARAJA API ERROR DETAILS:");
        if (error.response) {
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }
        return res.status(500).json({
            success: false,
            message: "Error generating M-Pesa gateway payload process"
        });
    }
});

// Test database connection
db.query('SELECT 1')
    .then(() => console.log('✅ Connected to the database successfully!'))
    .catch(err => console.error('❌ Database connection failed:', err.message));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Apex Fit Server running cleanly at http://localhost:${PORT}`);
});