require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL:', err.message);
        // Try to reconnect after 2 seconds
        setTimeout(() => {
            db.connect();
        }, 2000);
    } else {
        console.log('✅ MySQL connected successfully');
        console.log('Database:', process.env.DB_NAME);
    }
});

// Handle connection errors
db.on('error', (err) => {
    console.error('❌ MySQL error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        db.connect();
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
        db.connect();
    }
    if (err.code === 'ER_AUTH_USER_ERROR') {
        console.error('❌ Database authentication failed. Check your .env file');
    }
});

module.exports = db;
