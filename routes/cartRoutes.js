// backend/routes/cartRoutes.js

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

// --- Protected Cart Routes ---

// Apply the 'protect' middleware to all routes in this file.
router.use(protect);

// @route   GET /api/cart
// @desc    Get all items in the user's cart
// @access  Private
router.get('/', cartController.getCart);

// @route   POST /api/cart
// @desc    Add a product to the cart
// @access  Private
router.post('/', cartController.addItemToCart);

// CORRECTED: The specific '/clear' route is now placed BEFORE the parameterized '/:cartItemId' route.
// This ensures that requests to '/api/cart/clear' are handled by the correct controller function.
// @route   DELETE /api/cart/clear
// @desc    Clear all items from the user's cart
// @access  Private
router.delete('/clear', cartController.clearUserCart);

// @route   PUT /api/cart/:cartItemId
// @desc    Update the quantity of a specific item in the cart
// @access  Private
router.put('/:cartItemId', cartController.updateCartItem);

// @route   DELETE /api/cart/:cartItemId
// @desc    Remove a specific item from the cart
// @access  Private
router.delete('/:cartItemId', cartController.removeCartItem);

module.exports = router;
