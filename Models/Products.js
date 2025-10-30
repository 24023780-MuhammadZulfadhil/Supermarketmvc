const db = require('../db');

// Product model - handles ONLY database operations
const Product = {
    // Get all products
    getAll: function(callback) {
        const sql = 'SELECT * FROM products';
        db.query(sql, callback);
    },

    // Get product by ID
    getById: function(id, callback) {
        const sql = 'SELECT * FROM products WHERE id = ?';
        db.query(sql, [id], callback);
    },

    // Create new product
    create: function(productData, callback) {
        const sql = 'INSERT INTO products (productName, quantity, price, image) VALUES (?, ?, ?, ?)';
        db.query(sql, [
            productData.productName, 
            productData.quantity, 
            productData.price, 
            productData.image
        ], callback);
    },

    // Update existing product
    update: function(id, productData, callback) {
        const sql = 'UPDATE products SET productName = ?, quantity = ?, price = ?, image = ? WHERE id = ?';
        db.query(sql, [
            productData.productName, 
            productData.quantity, 
            productData.price, 
            productData.image, 
            id
        ], callback);
    },

    // Delete product
    delete: function(id, callback) {
        const sql = 'DELETE FROM products WHERE id = ?';
        db.query(sql, [id], callback);
    },

    // Check if product exists and has sufficient quantity
    checkAvailability: function(id, requiredQuantity, callback) {
        const sql = 'SELECT quantity FROM products WHERE id = ?';
        db.query(sql, [id], (err, results) => {
            if (err) return callback(err);
            if (results.length === 0) return callback(null, false);
            callback(null, results[0].quantity >= requiredQuantity);
        });
    }
};

module.exports = Product;