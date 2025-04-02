/**
 * @description MongoDB database connection configuration
 * @module config/db
 */

// Import required dependencies
const mongoose = require('mongoose');

/**
 * Establishes connection to MongoDB database using environment variables
 * @async
 * @function connectDB
 * @description Initializes connection to MongoDB using the URI from environment variables
 * @returns {Promise<void>} A promise that resolves when connection is established
 * @throws {Error} Exits process with code 1 if connection fails
 */
const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB using connection string from environment variables
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connection SUCCESS');
  }
  catch (error) {
    // Log error and exit process if connection fails
    console.error('MongoDB connection FAIL');
    process.exit(1);
  }
}

// Export database connection function
module.exports = connectDB;