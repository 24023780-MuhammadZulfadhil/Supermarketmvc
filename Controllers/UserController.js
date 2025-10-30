const User = require('../Models/User');

// User controller - handles user-related business logic
const userController = {
    // Register new user with validation
    register: function(userData, callback) {
        // Validate input
        if (!userData.username || !userData.email || !userData.password || 
            !userData.address || !userData.contact || !userData.role) {
            return callback(new Error('All fields are required'), null);
        }

        if (userData.password.length < 6) {
            return callback(new Error('Password must be at least 6 characters'), null);
        }

        // Check if email already exists
        User.findByEmail(userData.email, (err, results) => {
            if (err) {
                console.error('Error checking email:', err);
                return callback(err, null);
            }

            if (results.length > 0) {
                return callback(new Error('Email already registered'), null);
            }

            // Create user
            User.create(userData, (err, result) => {
                if (err) {
                    console.error('Error creating user:', err);
                    return callback(err, null);
                }
                callback(null, { id: result.insertId, username: userData.username });
            });
        });
    },

    // Login user
    login: function(email, password, callback) {
        if (!email || !password) {
            return callback(new Error('Email and password are required'), null);
        }

        User.findByCredentials(email, password, (err, results) => {
            if (err) {
                console.error('Error during login:', err);
                return callback(err, null);
            }

            if (results.length === 0) {
                return callback(new Error('Invalid email or password'), null);
            }

            // Remove password from returned user object
            const user = results[0];
            delete user.password;
            
            callback(null, user);
        });
    },

    // Get user by ID
    getUserById: function(id, callback) {
        User.findById(id, (err, results) => {
            if (err) {
                console.error('Error fetching user:', err);
                return callback(err, null);
            }

            if (results.length === 0) {
                return callback(new Error('User not found'), null);
            }

            const user = results[0];
            delete user.password;
            callback(null, user);
        });
    }
};

module.exports = userController;