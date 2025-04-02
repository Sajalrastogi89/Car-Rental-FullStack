/**
 * @description Car route configuration module for managing vehicle listings
 * @module routes/car
 */

// Import required dependencies
const express = require("express");
const { 
  addCar, 
  getCarById, 
  getCars, 
  getAllCarsByOwnerWithFilter, 
  getCarsForUserWithFilter, 
  deleteCar, 
  updateCar 
} = require("../controllers/car.controller");

// Import middleware
const carValidationRules = require("../middlewares/validateCarDetails");
const {
  uploadSingle, 
  optionalUploadSingle, 
  uploadToS3
} = require("../middlewares/uploadMiddleware");
const authenticateJWT = require("../middlewares/jwtTokenAuthenticate");
const authorizeRoles = require("../middlewares/roleAuthenticate");

// Initialize router
const router = express.Router();

/**
 * @description Route to retrieve all cars with optional filtering
 * @route GET /api/car/getCars
 * @middleware authenticateJWT - Verifies user authentication token
 * @access Private
 */
router.get("/getCars", authenticateJWT, getCars);

/**
 * @description Route to get a specific car by its ID
 * @route GET /api/car/carId/:id
 * @param {string} id - Car ID to retrieve
 * @middleware authenticateJWT - Verifies user authentication token
 * @access Private
 */
router.get("/carId/:id", authenticateJWT, getCarById);

/**
 * @description Route to add a new car listing
 * @route POST /api/car/addCar
 * @middleware authenticateJWT - Verifies user authentication token
 * @middleware authorizeRoles - Restricts access to users with 'owner' role
 * @middleware optionalUploadSingle - Handles car image upload if present
 * @middleware uploadToS3 - Uploads image to S3 storage
 * @middleware carValidationRules - Validates car details format
 * @access Private (Owner role only)
 */
router.post("/addCar", authenticateJWT, authorizeRoles("owner"), optionalUploadSingle, uploadToS3, carValidationRules, addCar); 

/**
 * @description Route to delete a car listing
 * @route POST /api/car/deleteCar/:id
 * @param {string} id - Car ID to delete
 * @middleware authenticateJWT - Verifies user authentication token
 * @middleware authorizeRoles - Restricts access to users with 'owner' role
 * @access Private (Owner role only)
 */
router.post("/deleteCar/:id", authenticateJWT, authorizeRoles("owner"), deleteCar);

/**
 * @description Route to update an existing car listing
 * @route PATCH /api/car/updateCar/:id
 * @param {string} id - Car ID to update
 * @middleware authenticateJWT - Verifies user authentication token
 * @middleware authorizeRoles - Restricts access to users with 'owner' role
 * @access Private (Owner role only)
 */
router.patch("/updateCar/:id", authenticateJWT, authorizeRoles("owner"), updateCar);

// Export the router
module.exports = router;