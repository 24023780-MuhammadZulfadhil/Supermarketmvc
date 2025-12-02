const Product = require('../Models/Products');

// Controller - handles business logic and data transformation
const productController = {
    // Get all products with error handling
    getAllProducts: function(callback) {
        Product.getAll((err, results) => {
            if (err) {
                console.error('Error fetching products:', err);
                return callback(err, null);
            }
            callback(null, results);
        });
    },

    // Get single product by ID
    getProductById: function(id, callback) {
        Product.getById(id, (err, results) => {
            if (err) {
                console.error('Error fetching product:', err);
                return callback(err, null);
            }
            if (results.length === 0) {
                return callback(new Error('Product not found'), null);
            }
            callback(null, results[0]);
        });
    },

    // Create product with data validation/transformation
    createProduct: function(data, callback) {
        // Transform incoming data to match database schema
        const productData = {
            productName: data.name,
            quantity: parseInt(data.quantity) || 0,
            price: parseFloat(data.price) || 0,
            image: data.image || null
        };

        // Validate required fields
        if (!productData.productName || productData.price <= 0) {
            return callback(new Error('Invalid product data'), null);
        }

        Product.create(productData, (err, result) => {
            if (err) {
                console.error('Error creating product:', err);
                return callback(err, null);
            }
            callback(null, { id: result.insertId, ...productData });
        });
    },

    // Update product with validation
    updateProduct: function(id, data, callback) {
        const productData = {
            productName: data.name,
            quantity: parseInt(data.quantity) || 0,
            price: parseFloat(data.price) || 0,
            image: data.image || data.currentImage || null
        };

        if (!productData.productName || productData.price <= 0) {
            return callback(new Error('Invalid product data'), null);
        }

        Product.update(id, productData, (err, result) => {
            if (err) {
                console.error('Error updating product:', err);
                return callback(err, null);
            }
            if (result.affectedRows === 0) {
                return callback(new Error('Product not found'), null);
            }
            callback(null, result);
        });
    },

    // Delete product
    deleteProduct: function(id, callback) {
        Product.delete(id, (err, result) => {
            if (err) {
                console.error('Error deleting product:', err);
                return callback(err, null);
            }
            if (result.affectedRows === 0) {
                return callback(new Error('Product not found'), null);
            }
            callback(null, result);
        });
    },

    // Add item to cart (business logic)
    addToCart: function(cart, productId, quantity, callback) {
        this.getProductById(productId, (err, product) => {
            if (err) return callback(err, null);

            if (product.quantity < quantity) {
                return callback(new Error('Insufficient stock'), null);
            }

            if (!cart) cart = [];

            const existingItem = cart.find(item => item.id === productId);
            if (existingItem) {
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

    // Calculate cart total
    calculateCartTotal: function(cart) {
        if (!cart || cart.length === 0) return 0;
        return cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    },

    // Search products by name
    searchProducts: function(query, callback) {
        this.getAllProducts((err, products) => {
            if (err) {
                return callback(err, null);
            }

            const searchResults = products.filter(product =>
                product.productName.toLowerCase().includes(query.toLowerCase())
            );

            if (searchResults.length === 0) {
                return callback(null, []);
            }

            callback(null, searchResults);
        });
    }
};

module.exports = productController;