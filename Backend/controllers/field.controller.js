/**
 * @description Controller for managing vehicle metadata fields (categories, features, fuel types, cities)
 * @module controllers/field
 */

// Import required models
const Category = require("../models/category.model");
const Feature = require("../models/feature.model");
const FuelType = require("../models/fuel.model");
const City = require("../models/city.model");

/**
 * @description Add a new vehicle category
 * @function addCategory
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.categoryName - Name of the category to add
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with status and message
 */
let addCategory = async (req, res) => {
    try {
        let { categoryName } = req.body;
        // Format category name with first letter uppercase, rest lowercase
        categoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase();
        
        // Check if category already exists
        let category = await Category.findOne({ categoryName });
        if (category) return res.status(400).json({ status: false, message: "Category already exists" });
        
        // Create and save new category
        let newCategory = new Category({ categoryName });
        let addedCategory = await newCategory.save();
        res.status(200).json({ status: true, message: "Category added", addedCategory });
    }
    catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

/**
 * @description Add a new vehicle feature
 * @function addFeature
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.featureName - Name of the feature to add
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with status and message
 */
let addFeature = async (req, res) => {
    try {
        let { featureName } = req.body;
        // Format feature name with first letter uppercase, rest lowercase
        featureName = featureName.charAt(0).toUpperCase() + featureName.slice(1).toLowerCase();
       
        // Check if feature already exists
        let feature = await Feature.findOne({ featureName });
        if(feature) return res.status(400).json({ status: false, message: "Feature already exists" });

        // Create and save new feature
        let newFeature = new Feature({ featureName });
        let addedfeature = await newFeature.save();
        res.status(200).json({ status: true, message: "Feature added", addedfeature });
    }
    catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

/**
 * @description Add a new fuel type
 * @function addFuelType
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.fuelName - Name of the fuel type to add
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with status and message
 */
let addFuelType = async (req, res) => {
    try {
        let { fuelName } = req.body;
        // Format fuel name with first letter uppercase, rest lowercase
        fuelName = fuelName.charAt(0).toUpperCase() + fuelName.slice(1).toLowerCase();
        
        // Check if fuel type already exists
        let fuelType = await FuelType.findOne({ fuelName });
        if(fuelType) return res.status(400).json({ status: false, message: "Fuel type already exists" });

        // Create and save new fuel type
        let newFuelType = new FuelType({ fuelName });
        let addedFuelType = await newFuelType.save();
        res.status(200).json({ status: true, message: "Fuel type added", addedFuelType });
    }
    catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

/**
 * @description Add a new city
 * @function addCity
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.cityName - Name of the city to add
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with status and message
 */
let addCity = async (req, res) => {
    try {
        let { cityName } = req.body;
        // Format city name with first letter uppercase, rest lowercase
        cityName = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();
        
        // Check if city already exists
        let city = await City.findOne({ cityName });
        if(city) return res.status(400).json({ status: false, message: "City already exists" });

        // Create and save new city
        let newCity = new City({ cityName });
        let addedCity = await newCity.save();
        res.status(200).json({ status: true, message: "City added", addedCity });
    }
    catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

/**
 * @description Get all vehicle categories
 * @function getCategories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with status and categories array
 */
let getCategories = async (req, res) => {
    try {
        let categories = await Category.find();
        res.status(200).json({ status: true, categories });
    }
    catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

/**
 * @description Get all vehicle features
 * @function getFeatures
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with status and features array
 */
let getFeatures = async (req, res) => {
    try {
        let features = await Feature.find();
        res.status(200).json({ status: true, features });
    }
    catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

/**
 * @description Get all fuel types
 * @function getFuelTypes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with status and fuelTypes array
 */
let getFuelTypes = async (req, res) => {
    try {
        let fuelTypes = await FuelType.find();
        res.status(200).json({ status: true, fuelTypes });
    }
    catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

/**
 * @description Get all cities
 * @function getCities
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with status and cities array
 */
let getCities = async (req, res) => {
    try {
        let cities = await City.find();
        res.status(200).json({ status: true, cities });
    }
    catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// Export controller functions
module.exports = { 
    addCategory, 
    addFeature, 
    addFuelType, 
    addCity, 
    getCategories, 
    getFeatures, 
    getFuelTypes, 
    getCities 
};

