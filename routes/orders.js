// backend/routes/orders.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// --- Protected Order Routes ---

// @route   POST /api/orders
// @desc    Create a new order from the user's cart
// @access  Private
// The 'protect' middleware ensures the user is logged in before they can place an order.
router.post('/', protect, orderController.createOrder);

// @route   GET /api/orders/my
// @desc    Get all orders for the currently logged-in user
// @access  Private
// This route allows users to view their own order history.
router.get('/my', protect, orderController.getUserOrders);

// @route   GET /api/orders/all
// @desc    Get all orders from all users (for admin use)
// @access  Private/Admin
// This route is protected by both authentication and role-based authorization.
router.get('/all', protect, authorizeRoles('admin'), orderController.getAllOrders);

module.exports = router;
