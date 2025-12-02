const db = require('./db');

// Cart model - handles ONLY database operations for cart history/orders
const Cart = {
    // Save cart order to database (for persistent storage/history)
    saveOrder: function(userId, cartItems, totalAmount, callback) {
        const sql = 'INSERT INTO orders (user_id, total_amount, created_at) VALUES (?, ?, NOW())';
        db.query(sql, [userId, totalAmount], (err, result) => {
            if (err) {
                console.error('Error inserting order:', err);
                return callback(err, null);
            }
            
            const orderId = result.insertId;
            
            // If no items, just return the order
            if (!cartItems || cartItems.length === 0) {
                return callback(null, { orderId, totalAmount });
            }

            // Save individual cart items as order items
            let completed = 0;

            cartItems.forEach(item => {
                const itemSql = 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)';
                db.query(itemSql, [orderId, item.id, item.quantity, item.price], (err) => {
                    if (err) {
                        console.error('Error inserting order item:', err);
                        // Continue anyway - don't fail the order
                    }
                    completed++;
                    if (completed === cartItems.length) {
                        callback(null, { orderId, totalAmount });
                    }
                });
            });
        });
    },

    // Update product quantity after purchase
    updateProductQuantity: function(productId, quantitySold, callback) {
        const sql = 'UPDATE products SET quantity = quantity - ? WHERE id = ?';
        db.query(sql, [quantitySold, productId], (err, result) => {
            if (err) {
                console.error('Error updating product quantity:', err);
                // Continue anyway - don't fail the payment
            }
            callback(null, result);
        });
    },

    // Get order history for user
    getOrdersByUser: function(userId, callback) {
        const sql = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
        db.query(sql, [userId], (err, results) => {
            if (err) {
                console.error('Error fetching orders:', err);
                return callback(null, []);
            }
            callback(null, results);
        });
    },

    // Get order items by order ID
    getOrderItems: function(orderId, callback) {
        const sql = 'SELECT * FROM order_items WHERE order_id = ?';
        db.query(sql, [orderId], (err, results) => {
            if (err) {
                console.error('Error fetching order items:', err);
                return callback(null, []);
            }
            callback(null, results);
        });
    }
};

module.exports = Cart;
