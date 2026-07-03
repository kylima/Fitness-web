const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware configuration
app.use(cors());
app.use(express.json());
app.use(express.static('.')); 

// 1. Bulletproof Database Connection Setup
const db = mysql.createConnection({
    host: '127.0.0.1',    // Using direct local IP to bypass any localhost permission rules
    user: 'root',
    password: '',         // Leave empty if you didn't set a password in your installation
    database: 'apex_fit'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection stalled: ' + err.stack);
        console.log('💡 Note: The server will still run payments, but won\'t log history.');
        return;
    }
    console.log('✅ Connected to the apex_fit database successfully!');
});

// 2. Integrated Enrollment Processing Endpoint
app.post('/api/enroll', (req, res) => {
    const { name, email, tier, phone, amount } = req.body;
    
    console.log(`\n🚀 Incoming Signup: ${name} (${phone})`);

    // SQL Query structure matching your local table schema
    const sqlQuery = "INSERT INTO enrollments (fullname, email, membership_tier) VALUES (?, ?, ?)";
    
    // Check if database is active before running the save operation
    if (db.state !== 'disconnected') {
        db.query(sqlQuery, [name, email, tier], (err, result) => {
            if (err) {
                console.error("❌ Failed to commit entry to database table:", err.message);
                // We keep moving forward so the user can still complete their payment!
            } else {
                console.log(`📝 Permanent record created successfully for ${name}.`);
            }
        });
    }

    // Return our successful registration token to the frontend layout
    return res.status(200).json({ 
        message: "STK Push simulated successfully!",
        status: "success"
    });
});
// Fetch all enrollments for the dashboard view
app.get('/api/admin/enrollments', (req, res) => {
    const query = 'SELECT * FROM enrollments ORDER BY id DESC'; // Update 'id' if you use a different primary key
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching dashboard data:', err);
            return res.status(500).json({ error: 'Database fetch failed' });
        }
        res.json(results);
    });
    // Clean route implementation for full user list mapping
app.get('/api/admin/enrollments', (req, res) => {
    const query = 'SELECT * FROM enrollments ORDER BY id DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database administration sync failed:', err);
            return res.status(500).json({ error: 'Database record assembly failed' });
        }
        res.json(results);
    });
});
});