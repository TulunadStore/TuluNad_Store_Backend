// backend/controllers/orderController.js

const db = require('../db');
const productController = require('./productController');
const cartModel = require('../models/cartModel');

/**
 * Creates a new order using a database transaction.
 */
exports.createOrder = async (req, res) => {
  const { items, totalAmount, shippingAddress } = req.body;
  const userId = req.user.id;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order must contain at least one item.' });
  }
  if (totalAmount === undefined || totalAmount === null) {
    return res.status(400).json({ message: 'Total amount is required.' });
  }
  if (!shippingAddress) {
    return res.status(400).json({ message: 'Shipping address is required.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // CORRECTED: Ensure the shippingAddress object is converted to a JSON string before insertion.
    const orderSql = 'INSERT INTO orders (user_id, total_amount, shipping_address, status) VALUES (?, ?, ?, ?)';
    const [orderResult] = await connection.query(orderSql, [userId, totalAmount, JSON.stringify(shippingAddress), 'pending']);
    const orderId = orderResult.insertId;

    for (const item of items) {
      const orderItemSql = 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)';
      // Use item.product_id and item.product_price from the cart items
      await connection.query(orderItemSql, [orderId, item.product_id, item.quantity, item.product_price]);
      await productController.deductProductStock(item.product_id, item.quantity, connection);
    }

    await cartModel.clearCart(userId);
    await connection.commit();

    res.status(201).json({
      message: 'Order placed successfully!',
      orderId: orderId,
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error placing order:', error);
    res.status(500).json({ message: error.message || 'Failed to place order.' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};


/**
 * Retrieves all orders for the currently authenticated user.
 */
exports.getUserOrders = async (req, res) => {
  const userId = req.user.id;
  try {
    const sql = `
      SELECT 
        o.id AS order_id, o.order_date, o.total_amount, o.status, o.shipping_address,
        oi.quantity, oi.price AS item_price, 
        p.name AS product_name, p.image_id AS product_image_id
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ?
      ORDER BY o.order_date DESC;
    `;
    const [results] = await db.query(sql, [userId]);

    const ordersMap = new Map();
    results.forEach(row => {
      if (!ordersMap.has(row.order_id)) {
        // CORRECTED: Add a safety check before parsing JSON.
        // This prevents crashes if the data is not a valid JSON string.
        let parsedAddress = null;
        try {
            if (typeof row.shipping_address === 'string') {
                parsedAddress = JSON.parse(row.shipping_address);
            } else {
                parsedAddress = row.shipping_address; // Assume it's already an object
            }
        } catch (e) {
            console.error(`Could not parse shipping address for order ID ${row.order_id}:`, row.shipping_address);
        }

        ordersMap.set(row.order_id, {
          order_id: row.order_id,
          order_date: row.order_date,
          total_amount: parseFloat(row.total_amount),
          status: row.status,
          shipping_address: parsedAddress,
          items: []
        });
      }
      ordersMap.get(row.order_id).items.push({
        product_name: row.product_name,
        quantity: row.quantity,
        item_price: parseFloat(row.item_price),
        image_url: row.product_image_id
      });
    });

    res.status(200).json(Array.from(ordersMap.values()));
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Failed to fetch user orders.' });
  }
};


/**
 * Retrieves all orders from all users (for admin use).
 */
exports.getAllOrders = async (req, res) => {
  try {
    const sql = `
      SELECT 
        o.id AS order_id, o.order_date, o.total_amount, o.status, o.shipping_address,
        u.username AS customer_username, u.email AS customer_email,
        oi.quantity, oi.price AS item_price, 
        p.name AS product_name, p.image_id AS product_image_id
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      ORDER BY o.order_date DESC;
    `;
    const [results] = await db.query(sql);

    const ordersMap = new Map();
    results.forEach(row => {
      if (!ordersMap.has(row.order_id)) {
        let parsedAddress = null;
        try {
            if (typeof row.shipping_address === 'string') {
                parsedAddress = JSON.parse(row.shipping_address);
            } else {
                parsedAddress = row.shipping_address;
            }
        } catch (e) {
            console.error(`Could not parse shipping address for order ID ${row.order_id}:`, row.shipping_address);
        }
        
        ordersMap.set(row.order_id, {
          order_id: row.order_id,
          order_date: row.order_date,
          total_amount: parseFloat(row.total_amount),
          status: row.status,
          shipping_address: parsedAddress,
          customer: { username: row.customer_username, email: row.customer_email },
          items: []
        });
      }
      ordersMap.get(row.order_id).items.push({
        product_name: row.product_name,
        quantity: row.quantity,
        item_price: parseFloat(row.item_price),
        image_url: row.product_image_id
      });
    });

    res.status(200).json(Array.from(ordersMap.values()));
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Failed to fetch all orders.' });
  }
};
