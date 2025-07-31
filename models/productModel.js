const db = require('../db'); // Correct path: db.js is in the root backend folder

const productModel = {
  /**
   * Retrieves all products from the database.
   * @param {function} callback - Callback function (err, results).
   */
  getAllProducts: (callback) => {
    const query = 'SELECT * FROM products ORDER BY created_at DESC';
    db.query(query, callback);
  },

  /**
   * Retrieves a single product by its ID.
   * @param {number} productId - The ID of the product.
   * @param {function} callback - Callback function (err, result).
   */
  getProductById: (productId, callback) => {
    const query = 'SELECT * FROM products WHERE id = ?';
    db.query(query, [productId], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      // Assuming product IDs are unique, return the first result
      callback(null, results[0]);
    });
  },

  /**
   * Creates a new product in the database.
   * @param {Object} productData - Object containing product details (name, description, price, etc.).
   * @param {function} callback - Callback function (err, result).
   */
  createProduct: (productData, callback) => {
    const query = `
      INSERT INTO products (name, description, price, image_id, category, brand, stock_quantity, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      productData.name,
      productData.description,
      productData.price,
      productData.image_id, // Assuming image_id is a URL or file path
      productData.category,
      productData.brand,
      productData.stock_quantity,
      productData.is_featured || 0 // Default to 0 if not provided
    ];
    db.query(query, values, callback);
  },

  /**
   * Updates an existing product in the database.
   * @param {number} productId - The ID of the product to update.
   * @param {Object} productData - Object containing updated product details.
   * @param {function} callback - Callback function (err, result).
   */
  updateProduct: (productId, productData, callback) => {
    const fields = [];
    const values = [];

    for (const key in productData) {
      if (productData.hasOwnProperty(key)) {
        fields.push(`${key} = ?`);
        values.push(productData[key]);
      }
    }

    if (fields.length === 0) {
      return callback(new Error('No fields to update.'), null);
    }

    values.push(productId); // Add product ID for WHERE clause
    const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
    db.query(query, values, callback);
  },

  /**
   * Deletes a product from the database.
   * @param {number} productId - The ID of the product to delete.
   * @param {function} callback - Callback function (err, result).
   */
  deleteProduct: (productId, callback) => {
    const query = 'DELETE FROM products WHERE id = ?';
    db.query(query, [productId], callback);
  },

  /**
   * Searches for products based on a search term in name or description.
   * @param {string} searchTerm - The term to search for.
   * @param {function} callback - Callback function (err, results).
   */
  searchProducts: (searchTerm, callback) => {
    const query = `
      SELECT * FROM products
      WHERE name LIKE ? OR description LIKE ?
      ORDER BY created_at DESC
    `;
    const searchPattern = `%${searchTerm}%`;
    db.query(query, [searchPattern, searchPattern], callback);
  }
};

module.exports = productModel;