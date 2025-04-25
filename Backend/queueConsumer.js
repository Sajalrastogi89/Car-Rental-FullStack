// Load environment variables
require('dotenv').config();


// Import required modules
const { getBidFromQueue } = require('./utils/sqs/consumer');
const express = require('express');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("joinUserRoom", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });
});

setInterval(async () => {
  try {
    await connectDB();
    const result = await getBidFromQueue();
    if (result && result.Messages && result.Messages.length > 0) {
      const message = JSON.parse(result.Messages[0].Body);
      
      // Emit new bid event to user's specific room
      io.to(message.user._id).emit('newBid', {
        userId: message.user._id,
        message: 'Bid placed successfully!',
        bid: message
      });
      
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
}, 3000);

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});