// backend/controllers/userController.js

const db = require('../db');
const bcrypt = require('bcryptjs');

/**
 * Update the password for the currently authenticated user.
 */
exports.updatePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  // 1. Validate input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide both the current and new passwords.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
  }

  try {
    // 2. Fetch the user's current hashed password from the database
    const [userRows] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const user = userRows[0];

    // 3. Verify if the provided current password matches the one in the database
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password.' });
    }

    // 4. Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 5. Update the user's password in the database
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

    res.status(200).json({ message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error during password update.' });
  }
};

/**
 * Get all saved addresses for the currently authenticated user.
 */
exports.getAddresses = async (req, res) => {
  const userId = req.user.id;

  try {
    const sql = 'SELECT id, full_name as fullName, address_line1 as address1, address_line2 as address2, city, state, pincode, phone_number as phone FROM user_addresses WHERE user_id = ? ORDER BY id DESC';
    const [addresses] = await db.query(sql, [userId]);
    res.status(200).json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ message: 'Failed to fetch addresses.' });
  }
};

/**
 * Add a new address for the currently authenticated user.
 */
exports.addAddress = async (req, res) => {
  const userId = req.user.id;
  const { fullName, address1, address2, city, state, pincode, phone } = req.body;

  // 1. Validate input
  if (!fullName || !address1 || !city || !state || !pincode || !phone) {
    return res.status(400).json({ message: 'Please provide all required address fields.' });
  }

  try {
    // 2. Insert the new address into the database
    const sql = 'INSERT INTO user_addresses (user_id, full_name, address_line1, address_line2, city, state, pincode, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [userId, fullName, address1, address2 || null, city, state, pincode, phone];
    const [result] = await db.query(sql, values);

    res.status(201).json({ 
        message: 'Address added successfully!', 
        addressId: result.insertId 
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ message: 'Failed to add address.' });
  }
};

/**
 * Delete an address for the currently authenticated user.
 */
exports.deleteAddress = async (req, res) => {
  const userId = req.user.id;
  const addressId = req.params.id;

  if (!addressId) {
    return res.status(400).json({ message: 'Address ID is required.' });
  }

  try {
    // The WHERE clause ensures users can only delete their own addresses
    const sql = 'DELETE FROM user_addresses WHERE id = ? AND user_id = ?';
    const [result] = await db.query(sql, [addressId, userId]);

    // Check if a row was actually deleted
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Address not found or you do not have permission to delete it.' });
    }

    res.status(200).json({ message: 'Address deleted successfully!' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ message: 'Failed to delete address.' });
  }
};
