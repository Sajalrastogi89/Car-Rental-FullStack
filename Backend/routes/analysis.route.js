/**
 * @description Analytics route configuration module for data analysis and reporting
 * @module routes/analysis
 */

// Import required dependencies
const express = require('express');
const { 
  getOwnerAnalytics, 
  getAdminAnalytics, 
  bookingCountAnalysis 
} = require('../controllers/analysis.controller');

// Import middleware
const authenticateToken = require('../middlewares/jwtTokenAuthenticate');

// Initialize router
const router = express.Router();

/**
 * @description Route to retrieve analytics data for car owners
 * @route GET /api/analysis/owner
 * @middleware authenticateToken - Verifies user authentication token
 * @access Private
 */
router.get('/owner', authenticateToken, getOwnerAnalytics);

/**
 * @description Route to retrieve analytics data for administrators
 * @route GET /api/analysis/admin
 * @access Public
 */
router.get('/admin', getAdminAnalytics);

/**
 * @description Route to retrieve booking count analysis data
 * @route GET /api/analysis/booking-count
 * @middleware authenticateToken - Verifies user authentication token
 * @access Private
 */
router.get('/booking-count', authenticateToken, bookingCountAnalysis);

// Export the router
module.exports = router;