const Product = require('../Models/Products');
const Cart = require('../Models/Cart');

// Cart controller - handles cart business logic
const cartController = {
    // Get cart items with product details
    getCart: function(cartItems, callback) {
        if (!cartItems || cartItems.length === 0) {
            return callback(null, []);
        }
        callback(null, cartItems);
    },

    // Add item to cart (validates stock)
    addToCart: function(cart, productId, quantity, callback) {
        Product.getById(productId, (err, results) => {
            if (err) return callback(err, null);
            
            if (!results || results.length === 0) {
                return callback(new Error('Product not found'), null);
            }

            const product = results[0];

            if (product.quantity < quantity) {
                return callback(new Error('Insufficient stock. Available: ' + product.quantity), null);
            }

            if (!cart) cart = [];

            const existingItem = cart.find(item => item.id === productId);
            if (existingItem) {
                // Check if adding more exceeds stock
                if (existingItem.quantity + quantity > product.quantity) {
                    return callback(new Error('Cannot add more items. Insufficient stock.'), null);
                }
                existingItem.quantity += quantity;
            } else {
                cart.push({
                    id: product.id,
                    productName: product.productName,
                    price: product.price,
                    quantity: quantity,
                    image: product.image
                });
            }

            callback(null, cart);
        });
    },

    // Remove item from cart
    removeFromCart: function(cart, productId, callback) {
        if (!cart) {
            return callback(null, []);
        }

        const updatedCart = cart.filter(item => item.id !== productId);
        callback(null, updatedCart);
    },

    // Update item quantity in cart
    updateCartItemQuantity: function(cart, productId, newQuantity, callback) {
        if (!cart) {
            return callback(new Error('Cart is empty'), null);
        }

        const item = cart.find(item => item.id === productId);
        if (!item) {
            return callback(new Error('Item not found in cart'), null);
        }

        // Verify stock availability
        Product.getById(productId, (err, results) => {
            if (err) return callback(err, null);

            const product = results[0];
            if (product.quantity < newQuantity) {
                return callback(new Error('Insufficient stock. Available: ' + product.quantity), null);
            }

            item.quantity = newQuantity;
            callback(null, cart);
        });
    },

    // Calculate cart total
    calculateCartTotal: function(cart) {
        if (!cart || cart.length === 0) return 0;
        return cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    },

    // Process payment and checkout
    processPayment: function(cart, userId, callback) {
        if (!cart || cart.length === 0) {
            return callback(new Error('Cart is empty'), null);
        }

        if (!userId) {
            return callback(new Error('User ID is required'), null);
        }

        const totalAmount = this.calculateCartTotal(cart);

        // Save order to database
        Cart.saveOrder(userId, cart, totalAmount, (err, order) => {
            if (err) {
                console.error('Error saving order:', err);
                return callback(err, null);
            }

            // Update product quantities
            let completed = 0;
            let hasError = false;

            cart.forEach(item => {
                Cart.updateProductQuantity(item.id, item.quantity, (err) => {
                    if (err && !hasError) {
                        hasError = true;
                        console.error('Error updating product quantity:', err);
                        return callback(err, null);
                    }
                    completed++;
                    if (completed === cart.length) {
                        callback(null, { 
                            success: true, 
                            orderId: order.orderId, 
                            totalAmount: totalAmount,
                            itemsCount: cart.length
                        });
                    }
                });
            });
        });
    },

    // Clear cart (after successful payment)
    clearCart: function(callback) {
        callback(null, []);
    }
};

module.exports = cartController;
