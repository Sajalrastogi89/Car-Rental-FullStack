/**
 * @description Field route configuration module for managing vehicle metadata
 * @module routes/field
 */

// Import required dependencies
const express = require('express');
const { 
  addCategory, 
  addFeature, 
  addFuelType, 
  addCity, 
  getCategories, 
  getFeatures, 
  getFuelTypes, 
  getCities 
} = require('../controllers/field.controller');
const authenticateJWT = require('../middlewares/jwtTokenAuthenticate');
const authorizeRoles = require('../middlewares/roleAuthenticate');

// Initialize router
const router = express.Router();

/**
 * @description Route to add a new vehicle category
 * @route POST /api/field/addNewCategory
 * @access Admin only
 */
router.post("/addNewCategory", authenticateJWT, authorizeRoles('admin'), addCategory);

/**
 * @description Route to add a new vehicle feature
 * @route POST /api/field/addNewFeature
 * @access Admin only
 */
router.post("/addNewFeature", authenticateJWT, authorizeRoles('admin'), addFeature);

/**
 * @description Route to add a new fuel type option
 * @route POST /api/field/addNewFuelType
 * @access Admin only
 */
router.post("/addNewFuelType", authenticateJWT, authorizeRoles('admin'), addFuelType);

/**
 * @description Route to add a new city location
 * @route POST /api/field/addNewCity
 * @access Admin only
 */
router.post("/addNewCity", authenticateJWT, authorizeRoles('admin'), addCity);

/**
 * @description Route to retrieve all vehicle categories
 * @route GET /api/field/getCategories
 * @access Public
 */
router.get("/getCategories", getCategories);

/**
 * @description Route to retrieve all vehicle features
 * @route GET /api/field/getFeatures
 * @access Public
 */
router.get("/getFeatures", getFeatures);

/**
 * @description Route to retrieve all fuel type options
 * @route GET /api/field/getFuelTypes
 * @access Public
 */
router.get("/getFuelTypes", getFuelTypes);

/**
 * @description Route to retrieve all city locations
 * @route GET /api/field/getCities
 * @access Public
 */
router.get("/getCities", getCities);

// Export the router
module.exports = router;