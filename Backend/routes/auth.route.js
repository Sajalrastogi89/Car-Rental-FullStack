/**
 * @description Authentication route configuration module for user login, signup, and profile management
 * @module routes/auth
 */

// Import required dependencies
const express = require("express");
const { 
  login, 
  signup, 
  profile 
} = require("../controllers/auth.controller");

// Import middleware
const validateSignup = require("../middlewares/validateSignup");
const validateLogin = require("../middlewares/validateLogin");
const authenticateJWT = require("../middlewares/jwtTokenAuthenticate");

// Initialize router
const router = express.Router();

/**
 * @description Route for user login
 * @route POST /api/auth/login
 * @middleware validateLogin - Validates login credentials format
 * @access Public
 */
router.post("/login", validateLogin, login);

/**
 * @description Route for user registration
 * @route POST /api/auth/signup
 * @middleware validateSignup - Validates signup information format
 * @access Public
 */
router.post("/signup", validateSignup, signup);

/**
 * @description Route to retrieve authenticated user's profile information
 * @route GET /api/auth/profile
 * @middleware authenticateJWT - Verifies user authentication token
 * @access Private
 */
router.get("/profile", authenticateJWT, profile);

// Export the router
module.exports = router;
