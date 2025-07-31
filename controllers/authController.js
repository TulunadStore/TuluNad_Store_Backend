// backend/controllers/authController.js

const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Generates a JSON Web Token (JWT) for a user.
 * @param {number} id - The user's ID.
 * @param {string} username - The user's name.
 * @param {string} email - The user's email.
 * @param {string} role - The user's role (e.g., 'user', 'admin').
 * @returns {string} The generated JWT.
 */
const signToken = (id, username, email, role) => {
  // CORRECTED: Added a fallback default value for expiresIn.
  // This makes the function more robust if the .env variable is not found.
  return jwt.sign({ id, username, email, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// --- User Registration ---
exports.signup = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // 1. Validate input
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  try {
    // 2. Check if user already exists
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const username = `${firstName} ${lastName}`;
    const role = 'user'; // Default role for new users

    // 4. Insert the new user into the database
    const sql = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
    const [result] = await db.query(sql, [username, email, hashedPassword, role]);

    // 5. Fetch the newly created user's data (without the password)
    const [newUserRows] = await db.query('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [result.insertId]);
    const newUser = newUserRows[0];

    // 6. Generate a JWT for the new user
    const token = signToken(newUser.id, newUser.username, newUser.email, newUser.role);

    // 7. Send a successful response with the token and user data
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: newUser,
    });

  } catch (error) {
    console.error('Error during user signup:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};


// --- User Login ---
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter both email and password.' });
  }

  try {
    // 2. Find the user by email
    const [rows] = await db.query('SELECT id, username, email, password, role, created_at FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // 3. Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // 4. Generate a JWT for the authenticated user
    const token = signToken(user.id, user.username, user.email, user.role);

    // 5. Send a successful response with the token and user data (excluding password)
    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
    });

  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};
