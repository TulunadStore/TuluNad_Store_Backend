// backend/controllers/cartController.js

const cartModel = require('../models/cartModel');

const cartController = {
  /**
   * Adds an item to the user's cart or updates its quantity.
   */
  addItemToCart: async (req, res) => {
    const { productId, quantity } = req.body;
    // The user's ID is attached to the request by the 'protect' middleware
    const userId = req.user.id;

    // Validate input: productId must be present, and quantity must be a positive number.
    if (!productId || typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ message: 'A valid Product ID and a positive quantity are required.' });
    }

    try {
      const result = await cartModel.addItem(userId, productId, quantity);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in addItemToCart controller:', error);
      res.status(500).json({ message: error.message || 'Failed to add item to cart.' });
    }
  },

  /**
   * Retrieves all items in the current user's cart.
   */
  getCart: async (req, res) => {
    const userId = req.user.id;

    try {
      const items = await cartModel.getCartItems(userId);
      res.status(200).json(items);
    } catch (error)
    {
      console.error('Error in getCart controller:', error);
      res.status(500).json({ message: error.message || 'Failed to retrieve cart items.' });
    }
  },

  /**
   * Updates the quantity of a specific item in the user's cart.
   */
  updateCartItem: async (req, res) => {
    const { cartItemId } = req.params; // Get cart item ID from the URL parameter
    const { quantity } = req.body;
    const userId = req.user.id;

    // Validate input: quantity must be a positive number.
    if (typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ message: 'A valid positive quantity is required.' });
    }

    try {
      const result = await cartModel.updateCartItemQuantity(cartItemId, userId, quantity);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in updateCartItem controller:', error);
      // Send a 404 status if the item was not found, otherwise a 500 for other errors.
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  /**
   * Removes a specific item from the user's cart.
   */
  removeCartItem: async (req, res) => {
    const { cartItemId } = req.params; // Get cart item ID from the URL parameter
    const userId = req.user.id;

    try {
      const result = await cartModel.removeCartItem(cartItemId, userId);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in removeCartItem controller:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  /**
   * Clears all items from the user's cart.
   */
  clearUserCart: async (req, res) => {
    const userId = req.user.id;

    try {
      const result = await cartModel.clearCart(userId);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in clearUserCart controller:', error);
      res.status(500).json({ message: error.message || 'Failed to clear cart.' });
    }
  }
};

module.exports = cartController;
