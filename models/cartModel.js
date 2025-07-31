// backend/models/cartModel.js

const db = require('../db');

const cartModel = {
  /**
   * Adds an item to the cart or updates its quantity if it already exists.
   * @param {number} userId - The ID of the user.
   * @param {number} productId - The ID of the product to add.
   * @param {number} quantity - The quantity of the product to add.
   * @returns {Promise<object>} A promise that resolves to an object with a success message and the cart item ID.
   */
  async addItem(userId, productId, quantity) {
    // First, check if the item already exists in the user's cart.
    const checkSql = 'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?';
    const [existingItems] = await db.query(checkSql, [userId, productId]);

    if (existingItems.length > 0) {
      // If the item exists, update its quantity by adding the new quantity.
      const existingCartItem = existingItems[0];
      const newQuantity = existingCartItem.quantity + quantity;
      const updateSql = 'UPDATE cart_items SET quantity = ? WHERE id = ?';
      await db.query(updateSql, [newQuantity, existingCartItem.id]);
      return { message: 'Cart item quantity updated successfully.', cartItemId: existingCartItem.id };
    } else {
      // If the item does not exist, insert it as a new entry in the cart.
      const insertSql = 'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)';
      const [result] = await db.query(insertSql, [userId, productId, quantity]);
      return { message: 'Product added to cart successfully.', cartItemId: result.insertId };
    }
  },

  /**
   * Retrieves all items in a user's cart, joining with the products table to get details.
   * @param {number} userId - The ID of the user.
   * @returns {Promise<Array>} A promise that resolves to an array of cart items.
   */
  async getCartItems(userId) {
    const sql = `
      SELECT
        ci.id AS cart_item_id,
        ci.product_id,
        ci.quantity,
        p.name AS product_name,
        p.price AS product_price,
        p.image_id AS product_image_id,
        p.stock_quantity AS product_stock_quantity
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?;
    `;
    const [items] = await db.query(sql, [userId]);
    
    // CORRECTED: Ensure product_price is a number before sending to the frontend.
    return items.map(item => ({
      ...item,
      product_price: parseFloat(item.product_price)
    }));
  },

  /**
   * Updates the quantity of a specific item in the cart.
   * @param {number} cartItemId - The ID of the cart item to update.
   * @param {number} userId - The ID of the user (for verification).
   * @param {number} quantity - The new quantity for the item.
   * @returns {Promise<object>} A promise that resolves to an object with a success message.
   */
  async updateCartItemQuantity(cartItemId, userId, quantity) {
    const sql = 'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?';
    const [result] = await db.query(sql, [quantity, cartItemId, userId]);
    if (result.affectedRows === 0) {
      throw new Error('Cart item not found or does not belong to the user.');
    }
    return { message: 'Cart item quantity updated successfully.' };
  },

  /**
   * Removes a specific item from the user's cart.
   * @param {number} cartItemId - The ID of the cart item to remove.
   * @param {number} userId - The ID of the user (for verification).
   * @returns {Promise<object>} A promise that resolves to an object with a success message.
   */
  async removeCartItem(cartItemId, userId) {
    const sql = 'DELETE FROM cart_items WHERE id = ? AND user_id = ?';
    const [result] = await db.query(sql, [cartItemId, userId]);
    if (result.affectedRows === 0) {
      throw new Error('Cart item not found or does not belong to the user.');
    }
    return { message: 'Product removed from cart successfully.' };
  },

  /**
   * Clears all items from a user's cart.
   * @param {number} userId - The ID of the user whose cart will be cleared.
   * @returns {Promise<object>} A promise that resolves to an object with a success message.
   */
  async clearCart(userId) {
    const sql = 'DELETE FROM cart_items WHERE user_id = ?';
    const [result] = await db.query(sql, [userId]);
    return { message: 'Cart cleared successfully.', affectedRows: result.affectedRows };
  }
};

module.exports = cartModel;
