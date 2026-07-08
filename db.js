const mysql = require('mysql2');

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root', // Replace with your MySQL DB Username
    password: '', // Replace with your MySQL DB Password
    database: 'pulse_fit',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();