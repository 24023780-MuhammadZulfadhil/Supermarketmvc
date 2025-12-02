const db = require('./db');

const Cart = {
    // Save order and order items
    saveOrder: function(userId, cartItems, totalAmount, callback) {
        const sql = 'INSERT INTO orders (user_id, total_amount, created_at) VALUES (?, ?, NOW())';
        db.query(sql, [userId, totalAmount], (err, result) => {
            const orderId = result ? result.insertId : Date.now();
            
            if (cartItems && cartItems.length > 0) {
                let completed = 0;
                cartItems.forEach(item => {
                    const itemSql = 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)';
                    db.query(itemSql, [orderId, item.id, item.quantity, item.price], () => {
                        completed++;
                        if (completed === cartItems.length) {
                            callback({ orderId, totalAmount });
                        }
                    });
                });
            } else {
                callback({ orderId, totalAmount });
            }
        });
    },

    // Update product quantity - remove purchased quantity from stock
    updateProductQuantity: function(productId, quantitySold, callback) {
        const sql = 'UPDATE products SET quantity = quantity - ? WHERE id = ?';
        db.query(sql, [quantitySold, productId], () => {
            if (callback) callback();
        });
    },

    // Get order history for user
    getOrdersByUser: function(userId, callback) {
        const sql = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
        db.query(sql, [userId], (err, results) => {
            callback(results || []);
        });
    },

    // Get order items by order ID
    getOrderItems: function(orderId, callback) {
        const sql = 'SELECT * FROM order_items WHERE order_id = ?';
        db.query(sql, [orderId], (err, results) => {
            callback(results || []);
        });
    }
};

module.exports = Cart;
