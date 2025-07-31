// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const db = require('../db');

/**
 * Middleware to protect routes by verifying JWT.
 * It checks for a token in the Authorization header, verifies it,
 * and attaches the decoded user payload to the request object.
 */
exports.protect = async (req, res, next) => {
  let token;

  // 1. Check if the token exists in the 'Authorization' header and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided.' });
  }

  try {
    // 2. Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach the decoded user information to the request object
    // This makes the user's ID, role, etc., available in subsequent controllers
    req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role
    };

    // 4. Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ message: 'Not authorized, token failed.' });
  }
};

/**
 * Middleware to authorize users based on their roles.
 * This should be used *after* the 'protect' middleware.
 * @param {...string} roles - A list of roles that are allowed to access the route.
 */
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Check if the user object exists (from 'protect' middleware) and if their role is included in the allowed roles
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `User role '${req.user?.role}' is not authorized to access this route.` });
    }
    // If authorized, proceed to the next middleware or route handler
    next();
  };
};
