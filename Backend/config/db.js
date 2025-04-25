const mongoose = require('mongoose');

/**
 * @description Initializes connection to MongoDB using the URI from environment variables
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
  }
  catch (error) {
    process.exit(1);
  }
}

// Export database connection function
module.exports = connectDB;