// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = 'path';

// --- Import API Routes ---
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cartRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---

// Enable CORS for your frontend application.
// It's a good practice to be specific about the origin in a production environment.
app.use(cors({
  origin: 'http://localhost:3000' 
}));

// Parse JSON bodies for incoming requests. This is crucial for POST and PUT requests.
app.use(express.json());

// Serve static files from the 'uploads' directory if it exists.
// This is useful for temporarily serving images uploaded via multer before they are sent to Cloudinary.
app.use('/uploads', express.static('uploads'));


// --- API Routes ---
// Mount the imported route handlers to their specific base paths.
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);


// --- Basic Root Route for Health Check ---
// A simple GET request to the root URL will confirm that the server is running.
app.get('/', (req, res) => {
  res.send('Tulunad Store Backend API is running!');
});


// --- Global Error Handling Middleware ---
// This middleware should be the last one in the chain.
// It catches any errors that occur in the route handlers.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke on the server!');
});


// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
