const db = require('../db');

// User model - handles user-related database operations
const User = {
    // Create new user
    create: function(userData, callback) {
        const sql = 'INSERT INTO users (username, email, password, address, contact, role) VALUES (?, ?, SHA1(?), ?, ?, ?)';
        db.query(sql, [
            userData.username,
            userData.email,
            userData.password,
            userData.address,
            userData.contact,
            userData.role
        ], callback);
    },

    // Find user by email and password
    findByCredentials: function(email, password, callback) {
        const sql = 'SELECT * FROM users WHERE email = ? AND password = SHA1(?)';
        db.query(sql, [email, password], callback);
    },

    // Find user by email
    findByEmail: function(email, callback) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        db.query(sql, [email], callback);
    },

    // Find user by ID
    findById: function(id, callback) {
        const sql = 'SELECT * FROM users WHERE id = ?';
        db.query(sql, [id], callback);
    },

    // Update user
    update: function(id, userData, callback) {
        const sql = 'UPDATE users SET username = ?, email = ?, address = ?, contact = ? WHERE id = ?';
        db.query(sql, [
            userData.username,
            userData.email,
            userData.address,
            userData.contact,
            id
        ], callback);
    }
};

module.exports = User;