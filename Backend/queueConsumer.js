// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app= express();

// Import required modules
const { getBidFromQueue } = require('./utils/sqs/consumer');
const connectDB = require('./config/db');

setInterval(async () => {
  try {
    await connectDB();
    const result = await getBidFromQueue();
    if (result && result.Messages && result.Messages.length > 0) {
      console.log('Message processed successfully');
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
}, 3000);