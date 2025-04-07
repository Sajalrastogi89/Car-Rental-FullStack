/**
 * @description Booking route configuration module for managing car reservations
 * @module routes/booking
 */

// Import required dependencies
const express = require('express');
const { 
  getAllBookings, 
  updateBooking,
  getBookedDates, 
  getBookingsByCarId,  
} = require('../controllers/booking.controller');

// Import middleware
const authenticateJWT = require('../middlewares/jwtTokenAuthenticate');
const authorizeRoles = require('../middlewares/roleAuthenticate');

// Initialize router
const router = express.Router();

/**
 * @description Route to retrieve all bookings for the authenticated user
 * @route GET /api/booking/getAllBookings
 * @middleware authenticateJWT - Verifies user authentication token
 * @access Private
 */
router.get('/getAllBookings', authenticateJWT, getAllBookings);

/**
 * @description Route to update an existing booking
 * @route PATCH /api/booking/updateBooking/:id
 * @param {string} id - Booking ID to update
 * @middleware authenticateJWT - Verifies user authentication token
 * @middleware authorizeRoles - Restricts access to users with 'owner' role
 * @access Private (Owner role only)
 */
router.patch('/updateBooking/:id', authenticateJWT, authorizeRoles("owner"), updateBooking);


/**
 * @description Route to get dates that are already booked for a car
 * @route GET /api/booking/bookedDates/:id
 * @param {string} id - Car ID to check booked dates
 * @middleware authenticateJWT - Verifies user authentication token
 * @access Private
 */
router.get('/bookedDates/:id', authenticateJWT, getBookedDates);

/**
 * @description Route to get all bookings for a specific car
 * @route GET /api/booking/getBookingsByCarId/:id
 * @param {string} id - Car ID to retrieve bookings for
 * @middleware authenticateJWT - Verifies user authentication token
 * @access Private
 */
router.get('/getBookingsByCarId/:id', authenticateJWT, getBookingsByCarId);

// Export the router
module.exports = router; 