/**
 * @description Chat route configuration module for messaging functionality
 * @module routes/chat
 */

// Import required dependencies
const express = require("express");
const { 
  getChats, 
  addChat, 
  addMessage, 
  getConversations 
} = require("../controllers/chat.controller");

// Import middleware
const authenticateJWT = require("../middlewares/jwtTokenAuthenticate");
const authorizeRoles = require("../middlewares/roleAuthenticate");
const { 
  optionalUploadSingle, 
  uploadToS3 
} = require("../middlewares/uploadMiddleware");

// Initialize router
const router = express.Router();

/**
 * @description Route to get all chats for the authenticated user
 * @route GET /api/chat/getChats
 * @middleware authenticateJWT - Verifies user authentication token
 * @access Private
 */
router.get("/getChats", authenticateJWT, getChats);

/**
 * @description Route to create a new chat
 * @route POST /api/chat/addNewChat
 * @middleware authenticateJWT - Verifies user authentication token
 * @middleware authorizeRoles - Restricts access to users with 'user' role
 * @access Private (User role only)
 */
router.post("/addNewChat", authenticateJWT, authorizeRoles("user"), addChat);

/**
 * @description Route to get conversation messages for a specific chat
 * @route GET /api/chat/getConversation/:id
 * @param {string} id - Chat ID to retrieve conversation for
 * @middleware authenticateJWT - Verifies user authentication token
 * @access Private
 */
router.get("/getConversation/:id", authenticateJWT, getConversations);

/**
 * @description Route to send a new message in a specific chat
 * @route POST /api/chat/sendMessage/:id
 * @param {string} id - Chat ID to send message to
 * @middleware authenticateJWT - Verifies user authentication token
 * @middleware optionalUploadSingle - Handles file upload if present
 * @middleware uploadToS3 - Uploads file to S3 storage if provided
 * @access Private
 */
router.post("/sendMessage/:id", authenticateJWT, optionalUploadSingle, uploadToS3, addMessage);

// Export the router
module.exports = router; 