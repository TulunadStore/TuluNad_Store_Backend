// backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// --- Protected User Routes ---

// Apply the 'protect' middleware to all routes defined in this file.
// This ensures that a user must be logged in to access any of these endpoints.
router.use(protect);

// @route   PATCH /api/users/updatePassword
// @desc    Update the password for the currently logged-in user
// @access  Private
router.patch('/updatePassword', userController.updatePassword);

// @route   GET /api/users/addresses
// @desc    Get all addresses for the logged-in user
// @access  Private
router.get('/addresses', userController.getAddresses);

// @route   POST /api/users/addresses
// @desc    Add a new address for the logged-in user
// @access  Private
router.post('/addresses', userController.addAddress);

// @route   DELETE /api/users/addresses/:id
// @desc    Delete an address by its ID for the logged-in user
// @access  Private
router.delete('/addresses/:id', userController.deleteAddress);

// Note: An update (PUT/PATCH) route for addresses can be added here if needed.
// For example: router.put('/addresses/:id', userController.updateAddress);

module.exports = router;
