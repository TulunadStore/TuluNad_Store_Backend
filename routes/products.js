// backend/routes/products.js

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// --- Multer Configuration for Image Uploads ---

// Define the path for the uploads directory
const uploadDir = 'uploads/';

// Ensure the uploads directory exists, create it if it doesn't
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer storage to save files temporarily on the server
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Save files to the 'uploads/' directory
    },
    filename: function (req, file, cb) {
        // Create a unique filename to prevent conflicts: timestamp + original filename
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });


// --- Product Routes ---

// @route   GET /api/products
// @desc    Fetch all products
// @access  Public
router.get('/', productController.getAllProducts);

// @route   GET /api/products/:id
// @desc    Fetch a single product by its ID
// @access  Public
router.get('/:id', productController.getProductById);

// @route   POST /api/products
// @desc    Create a new product
// @access  Private/Admin
router.post(
    '/',
    protect, // First, ensure the user is logged in
    authorizeRoles('admin'), // Then, ensure the user has an 'admin' role
    upload.single('image'), // Then, handle the single file upload with the field name 'image'
    productController.createProduct // Finally, call the controller function
);

// @route   PUT /api/products/:id
// @desc    Update an existing product by its ID
// @access  Private/Admin
router.put(
    '/:id',
    protect,
    authorizeRoles('admin'),
    upload.single('image'), // Also handle optional image upload on update
    productController.updateProduct
);

// @route   DELETE /api/products/:id
// @desc    Delete a product by its ID
// @access  Private/Admin
router.delete(
    '/:id',
    protect,
    authorizeRoles('admin'),
    productController.deleteProduct
);

module.exports = router;
