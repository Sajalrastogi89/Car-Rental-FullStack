/**
 * @description Bidding route configuration module for managing car bid operations
 * @module routes/bidding
 */

// Import required dependencies
const express = require("express");
const { 
  addBid, 
  acceptBid, 
  rejectBid, 
  getAllBids 
} = require("../controllers/bidding.controller");

// Import middleware
const authenticateJWT = require("../middlewares/jwtTokenAuthenticate");
const authorizeRoles = require("../middlewares/roleAuthenticate");
const validateBidDetails = require("../middlewares/validateBid");

// Initialize router
const router = express.Router();

/**
 * @description Route to retrieve all bids for the authenticated user
 * @route GET /api/bidding/getAllBids
 * @middleware authenticateJWT - Verifies user authentication token
 * @access Private
 */
router.get("/getAllBids", authenticateJWT, getAllBids);

/**
 * @description Route to create a new bid on a car
 * @route POST /api/bidding/addBidding
 * @middleware authenticateJWT - Verifies user authentication token
 * @middleware authorizeRoles - Restricts access to users with 'user' role
 * @middleware validateBidDetails - Validates bid information format
 * @access Private (User role only)
 */
router.post("/addBidding", authenticateJWT, authorizeRoles("user"), validateBidDetails, addBid);

/**
 * @description Route to accept a bid on a car listing
 * @route POST /api/bidding/acceptBid/:id
 * @param {string} id - Bid ID to accept
 * @middleware authenticateJWT - Verifies user authentication token
 * @middleware authorizeRoles - Restricts access to users with 'owner' role
 * @access Private (Owner role only)
 */
router.post("/acceptBid/:id", authenticateJWT, authorizeRoles("owner"), acceptBid);

/**
 * @description Route to reject a bid on a car listing
 * @route PUT /api/bidding/rejectBid/:id
 * @param {string} id - Bid ID to reject
 * @middleware authenticateJWT - Verifies user authentication token
 * @middleware authorizeRoles - Restricts access to users with 'owner' role
 * @access Private (Owner role only)
 */
router.put("/rejectBid/:id", authenticateJWT, authorizeRoles("owner"), rejectBid);

// Export the router
module.exports = router;