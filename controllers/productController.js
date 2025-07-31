// backend/controllers/productController.js

const db = require('../db');
const { uploadImage, deleteImage } = require('../services/cloudinaryService');
const fs = require('fs'); // Node.js File System module for utility functions

/**
 * Extracts the public_id from a full Cloudinary URL.
 * @param {string} imageUrl - The full URL of the Cloudinary image.
 * @returns {string|null} The extracted public_id or null if the URL is invalid.
 */
const getPublicIdFromUrl = (imageUrl) => {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
        return null;
    }
    // Example URL: http://res.cloudinary.com/cloud_name/image/upload/v12345/folder/public_id.jpg
    // We need to extract "folder/public_id"
    try {
        const parts = imageUrl.split('/');
        // Find the index of 'upload'
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1 || uploadIndex + 2 >= parts.length) {
            return null; // Invalid format
        }
        // The public_id is everything after the version number
        const publicIdWithExtension = parts.slice(uploadIndex + 2).join('/');
        // Remove the file extension (.jpg, .png, etc.)
        const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
        return publicId;
    } catch (e) {
        console.error("Could not parse public_id from URL:", imageUrl);
        return null;
    }
};


// --- Public Product Operations ---

// Fetch all products for public display
exports.getAllProducts = async (req, res) => {
    try {
        const sql = 'SELECT * FROM products ORDER BY created_at DESC';
        const [products] = await db.query(sql);

        // Ensure price and stock are correctly formatted numbers
        const formattedProducts = products.map(p => ({
            ...p,
            price: parseFloat(p.price),
            stock_quantity: parseInt(p.stock_quantity, 10),
            // The image_id column now stores the full Cloudinary URL
            image_url: p.image_id
        }));

        res.status(200).json(formattedProducts);
    } catch (error) {
        console.error('Error fetching all products:', error);
        res.status(500).json({ message: 'Failed to fetch products.' });
    }
};

// Fetch a single product by its ID
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'SELECT * FROM products WHERE id = ?';
        const [rows] = await db.query(sql, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const product = {
            ...rows[0],
            price: parseFloat(rows[0].price),
            stock_quantity: parseInt(rows[0].stock_quantity, 10),
            image_url: rows[0].image_id
        };

        res.status(200).json(product);
    } catch (error) {
        console.error(`Error fetching product with ID ${req.params.id}:`, error);
        res.status(500).json({ message: 'Failed to fetch product.' });
    }
};


// --- Admin Product Management ---

// Admin: Create a new product
exports.createProduct = async (req, res) => {
    const { name, description, price, stock_quantity, category } = req.body;
    const imageFile = req.file;

    // 1. Validate input
    if (!name || !price || !stock_quantity) {
        // If validation fails, delete the uploaded temp file if it exists
        if (imageFile) fs.unlinkSync(imageFile.path);
        return res.status(400).json({ message: 'Name, price, and stock quantity are required fields.' });
    }
    if (!imageFile) {
        return res.status(400).json({ message: 'Product image is required.' });
    }

    try {
        // 2. Upload image to Cloudinary
        const uploadedImage = await uploadImage(imageFile.path, imageFile.originalname);
        const imageUrl = uploadedImage.url;

        // 3. Insert product into the database with the Cloudinary URL
        const sql = 'INSERT INTO products (name, description, price, stock_quantity, image_id, category) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [name, description, parseFloat(price), parseInt(stock_quantity, 10), imageUrl, category || null]);

        // 4. Send success response
        res.status(201).json({
            message: 'Product created successfully!',
            productId: result.insertId,
            image_url: imageUrl
        });
    } catch (error) {
        console.error('Error creating product:', error);
        // Note: The uploadImage service already cleans up the temp file on failure.
        res.status(500).json({ message: error.message || 'Failed to create product.' });
    }
};

// Admin: Update an existing product
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock_quantity, category } = req.body;
    const imageFile = req.file;

    // 1. Validate input
    if (!name || !price || !stock_quantity) {
        if (imageFile) fs.unlinkSync(imageFile.path);
        return res.status(400).json({ message: 'Name, price, and stock quantity are required.' });
    }

    try {
        // 2. Fetch the current product to get the old image URL
        const [existingProducts] = await db.query('SELECT image_id FROM products WHERE id = ?', [id]);
        if (existingProducts.length === 0) {
            if (imageFile) fs.unlinkSync(imageFile.path);
            return res.status(404).json({ message: 'Product not found.' });
        }
        const oldImageUrl = existingProducts[0].image_id;
        let newImageUrl = oldImageUrl;

        // 3. If a new image is provided, upload it and delete the old one
        if (imageFile) {
            const uploadedImage = await uploadImage(imageFile.path, imageFile.originalname);
            newImageUrl = uploadedImage.url;

            // Delete the old image from Cloudinary
            const oldPublicId = getPublicIdFromUrl(oldImageUrl);
            if (oldPublicId) {
                await deleteImage(oldPublicId);
            }
        }

        // 4. Update the product in the database
        const sql = 'UPDATE products SET name = ?, description = ?, price = ?, stock_quantity = ?, image_id = ?, category = ? WHERE id = ?';
        await db.query(sql, [name, description, parseFloat(price), parseInt(stock_quantity, 10), newImageUrl, category || null, id]);

        // 5. Send success response
        res.status(200).json({
            message: 'Product updated successfully!',
            image_url: newImageUrl
        });
    } catch (error) {
        console.error(`Error updating product with ID ${id}:`, error);
        res.status(500).json({ message: error.message || 'Failed to update product.' });
    }
};

// Admin: Delete a product
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Fetch the product to get its image URL before deleting from DB
        const [products] = await db.query('SELECT image_id FROM products WHERE id = ?', [id]);
        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        const imageUrl = products[0].image_id;

        // 2. Delete the product from the database
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            // This case is unlikely if the previous check passed, but it's good practice
            return res.status(404).json({ message: 'Product not found for deletion.' });
        }

        // 3. Delete the associated image from Cloudinary
        const publicId = getPublicIdFromUrl(imageUrl);
        if (publicId) {
            await deleteImage(publicId);
        }

        // 4. Send success response
        res.status(200).json({ message: 'Product deleted successfully.' });
    } catch (error) {
        console.error(`Error deleting product with ID ${id}:`, error);
        res.status(500).json({ message: 'Failed to delete product.' });
    }
};


// --- Internal Stock Management (used by the order controller) ---

exports.deductProductStock = async (productId, quantity, connection) => {
    // Use the provided database connection (for transactions) or the main pool
    const dbConnection = connection || db;
    const sql = 'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?';
    const [result] = await dbConnection.query(sql, [quantity, productId, quantity]);
    
    if (result.affectedRows === 0) {
        throw new Error(`Insufficient stock or product not found for product ID: ${productId}`);
    }
    return true;
};
