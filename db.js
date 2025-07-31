// backend/db.js

const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool to manage multiple simultaneous connections.
// Using a pool is more efficient than creating a new connection for every query.
const pool = mysql.createPool({
  connectionLimit: 10, // The maximum number of connections to create at once.
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true, // Determines the pool's action when no connections are available.
  queueLimit: 0, // The maximum number of connection requests the pool will queue. 0 = no limit.
});

// Add event listeners for the pool for better logging and debugging.
pool.on('acquire', (connection) => {
  console.log('Connection %d acquired', connection.threadId);
});

pool.on('release', (connection) => {
  console.log('Connection %d released', connection.threadId);
});

// Test the database connection on startup.
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused.');
    }
    // It's critical to exit if the DB connection fails on startup.
    process.exit(1);
  }
  if (connection) {
    console.log('Successfully connected to the MySQL database.');
    connection.release();
  }
});

// Export the pool with a promise-based interface for modern async/await syntax.
module.exports = pool.promise();
