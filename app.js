const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const multer = require('multer');

// Check if controllers exist before requiring
console.log('Loading controllers...');
let productController, userController;

try {
    productController = require('./Controllers/ProductController');
    console.log('✅ SupermarketController loaded');
} catch (err) {
    console.error('❌ Error loading ProductController:', err.message);
    process.exit(1);
}

try {
    userController = require('./Controllers/UserController');
    console.log('✅ UserController loaded');
} catch (err) {
    console.error('❌ Error loading UserController:', err.message);
    console.error('Make sure Controllers/UserController.js exists!');
    process.exit(1);
}

const app = express();

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Prevent name conflicts
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// View engine
app.set('view engine', 'ejs');

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' // HTTPS only in production
    }
}));

app.use(flash());

// Global variables for views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// ============== MIDDLEWARE ==============

// Check if user is authenticated
const checkAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    req.flash('error', 'Please log in to view this resource');
    res.redirect('/login');
};

// Check if user is admin
const checkAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    req.flash('error', 'Access denied. Admin privileges required.');
    res.redirect('/shopping');
};

// ============== ROUTES ==============

// Home page
app.get('/', (req, res) => {
    res.render('index');
});

// Registration routes
app.get('/register', (req, res) => {
    res.render('register', { 
        messages: req.flash('error'),
        formData: req.flash('formData')[0] || {}
    });
});

app.post('/register', (req, res) => {
    console.log('Registration attempt:', req.body.email);
    userController.register(req.body, (err, user) => {
        if (err) {
            console.error('Registration error:', err.message);
            req.flash('error', err.message);
            req.flash('formData', req.body);
            return res.redirect('/register');
        }
        console.log('Registration successful for:', req.body.email);
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/login');
    });
});

// Login routes
app.get('/login', (req, res) => {
    res.render('login', {
        messages: req.flash('success') || [],
        errors: req.flash('error') || []
    });
});

app.post('/login', (req, res, next) => {
    const { email, password } = req.body;
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Password received:', password ? 'YES' : 'NO');
    console.log('=====================');

    // Check if userController exists
    if (!userController || !userController.login) {
        console.error('❌ UserController or login function not found!');
        return res.status(500).send('UserController not properly configured');
    }

    userController.login(email, password, (err, user) => {
        if (err) {
            console.error('Login error:', err.message);
            req.flash('error', err.message);
            return res.redirect('/login');
        }

        console.log('✅ Login successful for:', email);
        req.session.user = user;
        req.flash('success', 'Login successful!');
        
        // Redirect based on role
        const redirectPath = user.role === 'admin' ? '/inventory' : '/shopping';
        console.log('Redirecting to:', redirectPath);
        res.redirect(redirectPath);
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Error destroying session:', err);
        res.redirect('/');
    });
});

// ============== PRODUCT ROUTES (USER) ==============

// Shopping page - view all products
app.get('/shopping', checkAuthenticated, (req, res) => {
    productController.getAllProducts((err, products) => {
        if (err) {
            req.flash('error', 'Error loading products');
            return res.redirect('/');
        }
        res.render('shopping', { products });
    });
});

// View single product
app.get('/product/:id', checkAuthenticated, (req, res) => {
    productController.getProductById(req.params.id, (err, product) => {
        if (err) {
            req.flash('error', 'Product not found');
            return res.redirect('/shopping');
        }
        res.render('product', { product });
    });
});

// ============== CART ROUTES ==============

// View cart
app.get('/cart', checkAuthenticated, (req, res) => {
    const cart = req.session.cart || [];
    const total = productController.calculateCartTotal(cart);
    res.render('cart', { cart, total });
});

// Add to cart
app.post('/add-to-cart/:id', checkAuthenticated, (req, res) => {
    const productId = parseInt(req.params.id);
    const quantity = parseInt(req.body.quantity) || 1;

    productController.addToCart(req.session.cart, productId, quantity, (err, updatedCart) => {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('/shopping');
        }
        
        req.session.cart = updatedCart;
        req.flash('success', 'Item added to cart');
        res.redirect('/cart');
    });
});

// Remove from cart
app.post('/remove-from-cart/:id', checkAuthenticated, (req, res) => {
    const productId = parseInt(req.params.id);
    if (req.session.cart) {
        req.session.cart = req.session.cart.filter(item => item.id !== productId);
    }
    req.flash('success', 'Item removed from cart');
    res.redirect('/cart');
});

// ============== INVENTORY ROUTES (ADMIN) ==============

// View inventory
app.get('/inventory', checkAuthenticated, checkAdmin, (req, res) => {
    productController.getAllProducts((err, products) => {
        if (err) {
            req.flash('error', 'Error loading inventory');
            return res.redirect('/');
        }
        res.render('inventory', { products });
    });
});

// Add product page
app.get('/addProduct', checkAuthenticated, checkAdmin, (req, res) => {
    res.render('addProduct');
});

// Add product handler
app.post('/addProduct', checkAuthenticated, checkAdmin, upload.single('image'), (req, res) => {
    const productData = {
        name: req.body.name,
        price: req.body.price,
        quantity: req.body.quantity,
        image: req.file ? req.file.filename : null
    };

    productController.createProduct(productData, (err, result) => {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('/addProduct');
        }
        req.flash('success', 'Product added successfully');
        res.redirect('/inventory');
    });
});

// Update product page
app.get('/updateProduct/:id', checkAuthenticated, checkAdmin, (req, res) => {
    productController.getProductById(req.params.id, (err, product) => {
        if (err) {
            req.flash('error', 'Product not found');
            return res.redirect('/inventory');
        }
        res.render('updateProduct', { product });
    });
});

// Update product handler
app.post('/updateProduct/:id', checkAuthenticated, checkAdmin, upload.single('image'), (req, res) => {
    const productData = {
        name: req.body.name,
        price: req.body.price,
        quantity: req.body.quantity,
        image: req.file ? req.file.filename : req.body.currentImage
    };

    productController.updateProduct(req.params.id, productData, (err, result) => {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('/updateProduct/' + req.params.id);
        }
        req.flash('success', 'Product updated successfully');
        res.redirect('/inventory');
    });
});

// Delete product
app.get('/deleteProduct/:id', checkAuthenticated, checkAdmin, (req, res) => {
    productController.deleteProduct(req.params.id, (err, result) => {
        if (err) {
            req.flash('error', err.message);
        } else {
            req.flash('success', 'Product deleted successfully');
        }
        res.redirect('/inventory');
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { url: req.url });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('=== ERROR CAUGHT ===');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Request URL:', req.url);
    console.error('Request method:', req.method);
    console.error('===================');
    res.status(500).send(`Error: ${err.message}`);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});