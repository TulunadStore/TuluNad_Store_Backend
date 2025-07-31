// backend/routes/auth.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// --- Public Authentication Routes ---

// @route   POST api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', authController.signup);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.login);


// --- Protected Route Example ---

// @route   GET api/auth/me
// @desc    Get current user's data (requires token)
// @access  Private
router.get('/me', authMiddleware.protect, (req, res) => {
  // The 'protect' middleware adds the user object to the request.
  // We can now send back the user's information.
  res.status(200).json({
    success: true,
    data: req.user 
  });
});

module.exports = router;
