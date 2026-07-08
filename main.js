// Global variable to capture client phone from the session
let userPhoneNumber = "";

// Parse URL configurations safely during view mounts
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const portal = params.get('portal');
    if (portal) switchRole(portal);

    if (window.location.pathname === '/dashboard') {
        loadDashboardData();
    }
});

function switchRole(role) {
    document.getElementById('form-role').value = role;
    document.getElementById('toggle-client').className = role === 'client' ? 'active' : '';
    document.getElementById('toggle-employee').className = role === 'employee' ? 'active' : '';
    toggleFormType(document.getElementById('form-action').value);
}

function toggleFormType(action) {
    document.getElementById('form-action').value = action;
    const role = document.getElementById('form-role').value;
    
    document.getElementById('tab-signup').className = action === 'signup' ? 'active-tab' : '';
    document.getElementById('tab-login').className = action === 'login' ? 'active-tab' : '';

    document.getElementById('form-title').innerText = `${role === 'client' ? 'Client' : 'Employee'} ${action === 'signup' ? 'Sign Up' : 'Login'}`;
    document.getElementById('btn-submit').innerText = action === 'signup' ? 'Complete Registration' : 'Secure Login';

    if (action === 'login') {
        document.getElementById('group-name').classList.add('hidden');
        document.getElementById('group-phone').classList.add('hidden');
    } else {
        document.getElementById('group-name').classList.remove('hidden');
        document.getElementById('group-phone').classList.remove('hidden');
    }
}

async function handleAuthSubmit(event) {
    event.preventDefault();
    const action = document.getElementById('form-action').value;
    const msgBox = document.getElementById('message-box');
    
    const payload = {
        role: document.getElementById('form-role').value,
        email: document.getElementById('auth-email').value,
        password: document.getElementById('auth-password').value,
        name: document.getElementById('auth-name')?.value || '',
        phone: document.getElementById('auth-phone')?.value || ''
    };

    try {
        const response = await fetch(`/api/auth/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Request processing failure');

        msgBox.className = "alert alert-success";
        msgBox.innerText = result.message;
        msgBox.classList.remove('hidden');

        setTimeout(() => window.location.href = '/dashboard', 1000);
    } catch (err) {
        msgBox.className = "alert alert-error";
        msgBox.innerText = err.message;
        msgBox.classList.remove('hidden');
    }
}

async function loadDashboardData() {
    try {
        const response = await fetch('/api/user/session');
        if (!response.ok) throw new Error();
        const data = await response.json();

        document.getElementById('user-display-name').innerText = data.name;
        document.getElementById('user-display-role').innerText = data.role;

        // Cache the phone number from session inside global variable
        userPhoneNumber = data.phone || "";

        if (data.role === 'client') {
            document.getElementById('client-view').classList.remove('hidden');
        } else if (data.role === 'employee') {
            document.getElementById('employee-view').classList.remove('hidden');
            const statsRes = await fetch('/api/admin/metrics');
            const stats = await statsRes.json();
            document.getElementById('stat-users').innerText = stats.totalUsers;
            document.getElementById('stat-revenue').innerText = `Ksh ${parseFloat(stats.totalRevenue || 0).toLocaleString()}`;
        }
    } catch {
        window.location.href = '/auth';
    }
}

async function triggerPayment() {
    const payMsg = document.getElementById('pay-message');
    payMsg.className = "alert alert-success";
    payMsg.innerText = "Sending STK Push prompt to your phone... Check your handset.";
    payMsg.classList.remove('hidden');

    try {
        const res = await fetch('/api/payment/stkpush', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: userPhoneNumber })
        });
        
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'STK Push integration failed');
        payMsg.innerText = "Payment Prompt sent successfully! Input your M-PESA PIN.";
    } catch (err) {
        payMsg.className = "alert alert-error";
        payMsg.innerText = err.message;
    }
}