/**
 * @description Controller for managing car listings and operations
 * @module controllers/car
 */

// Import required dependencies
const { validationResult } = require("express-validator");
const Car = require('../models/car.model');

/**
 * @description Add a new car listing
 * @function addCar
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing car details
 * @param {string} req.body.carName - Name or model of the car
 * @param {string} req.body.category - Vehicle category
 * @param {string} req.body.numberPlate - Vehicle registration number
 * @param {string} req.body.fuelType - Type of fuel used by the car
 * @param {number} req.body.basePrice - Base rental price
 * @param {number} req.body.pricePerKm - Additional charge per kilometer
 * @param {number} req.body.outStationCharges - Charges for out-of-city travel
 * @param {number} req.body.travelled - Total kilometers travelled by the car
 * @param {string} req.body.city - Location city of the car
 * @param {string} req.body.imageUrl - URL to the car image
 * @param {Array} req.body.features - List of features available in the car
 * @param {number} req.body.finePercentage - Percentage for late return fine
 * @param {Object} req.user - Authenticated user object from JWT middleware
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with status and message
 */
let addCar = async (req, res) => {
  try { 
    // Check validation middleware result
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: false, errors: errors.array() });
    }
   
    // Deconstruct details from request body
    let { 
      carName, 
      category, 
      numberPlate, 
      fuelType, 
      basePrice, 
      pricePerKm, 
      outStationCharges, 
      travelled, 
      city, 
      imageUrl, 
      features, 
      finePercentage 
    } = req.body;
   
    // Parse features JSON string to array
    features = JSON.parse(features);
   
    // Format city name with first letter uppercase
    city = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

    // Create car object with owner details
    let carObject = { 
      carName, 
      category, 
      numberPlate, 
      fuelType, 
      basePrice, 
      pricePerKm, 
      outStationCharges, 
      travelled, 
      city, 
      imageUrl, 
      features, 
      finePercentage,
      owner: {
        _id: req.user._id, 
        role: req.user.role, 
        name: req.user.name, 
        phone: req.user.phone, 
        email: req.user.email
      } 
    };

    // Save car to database
    let car = new Car(carObject);
    let addedCar = await car.save();
    
    // Send success response
    res.status(201).json({ 
      status: true, 
      message: "Car created", 
      car: addedCar 
    });
  }
  catch (error) {
    // Send error response
    res.status(500).json({ 
      status: false, 
      message: error.message 
    });
  }
};

/**
 * @description Get car details by ID
 * @function getCarById
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Car ID to retrieve
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with car details
 */
let getCarById = async (req, res) => {
  try {
    // Create query to find active car by ID
    let findObject = {
      _id: req.params.id, 
      isDisabled: false
    };

    // Find car by ID
    let car = await Car.findOne(findObject);
    if (!car) return res.status(404).json({ 
      status: false, 
      message: "Car not found" 
    });

    // Send success response with car details
    res.status(200).json({ 
      status: true, 
      car 
    });
  } catch (error) {
    // Send error response
    res.status(500).json({ 
      status: false, 
      message: error.message 
    });
  }
};

/**
 * @description Get cars with filtering, sorting and pagination
 * @function getCars
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters for filtering and pagination
 * @param {string} [req.query.carName] - Filter by car name (partial match)
 * @param {string} [req.query.city] - Filter by city
 * @param {string} [req.query.category] - Filter by vehicle category
 * @param {string} [req.query.fuelType] - Filter by fuel type
 * @param {string} [req.query.sortBy=createdAt] - Field to sort by
 * @param {number} [req.query.sortOrder=1] - Sort order (1 for ascending, -1 for descending)
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.limit=3] - Results per page
 * @param {Object} req.user - Authenticated user object from JWT middleware
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with filtered cars and metadata
 */
let getCars = async (req, res) => {
  try {
    // Deconstruct query parameters with defaults
    let {
      carName, 
      city, 
      category, 
      fuelType, 
      sortBy = "createdAt", 
      sortOrder = 1, 
      page = 1, 
      limit = 3
    } = req.query;
   
    // Create query object for filtering
    let query = {};
    
    // Add filters if provided
    if (city) query.city = city;
    if (category) query.category = category;
    if (fuelType) query.fuelType = fuelType;
    if (carName && carName.trim()) {
      query.carName = { $regex: carName, $options: 'i' };
    }

    // Apply role-based filtering
    let user = req.user;
    if (user.role === "owner") {
      // Owners only see their own cars
      query["owner._id"] = user._id;
    } 
    else if (user.role === "user") {
      // Users only see active cars
      query.isDisabled = false;
    }

    // Convert pagination and sorting values from string to int
    page = parseInt(page);
    limit = parseInt(limit);
    sortOrder = parseInt(sortOrder);

    // Create sort object
    let sortObject = {};
    sortObject[sortBy] = sortOrder;
    
    // Aggregation pipeline for filtering, sorting, paginating
    const pipeline = [
      { $match: query },
      { $sort: sortObject },
      { $facet: {
        metadata: [ 
          { $count: "total" }, 
          { $addFields: { page: page, limit: limit } } 
        ],
        data: [ 
          { $skip: (page - 1) * limit }, 
          { $limit: limit } 
        ]
      }}
    ];
    
    // Execute aggregation
    let carsData = await Car.aggregate(pipeline);
    
    // Extract metadata or provide defaults
    const metadata = carsData[0].metadata[0] || { 
      total: 0, 
      page: page, 
      limit: limit 
    };
  
    // Send success response
    res.status(200).json({
      status: true, 
      cars: carsData[0].data, 
      metadata: metadata
    });
  }
  catch (error) {
    // Send error response
    res.status(500).json({
      status: false, 
      message: error.message
    });
  }
};

/**
 * @description Soft delete (disable) a car
 * @function deleteCar
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Car ID to delete
 * @param {Object} req.user - Authenticated user object from JWT middleware
 * @param {string} req.user._id - User ID of car owner
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with status and message
 */
let deleteCar = async (req, res) => {
  try {
    // Create find object to ensure car belongs to the owner
    let findObject = {
      _id: req.params.id, 
      "owner._id": req.user._id, 
      isDisabled: false
    };
    
    // Soft delete by updating isDisabled flag
    let car = await Car.findOneAndUpdate(
      findObject, 
      { $set: { isDisabled: true } }, 
      { new: true }
    );
    
    // Check if car exists and belongs to owner
    if (!car) return res.status(404).json({
      status: false, 
      message: "Car not found"
    });

    // Send success response
    res.status(200).json({
      status: true, 
      message: "Car disabled", 
      car: car
    });
  }
  catch (error) {
    // Send error response
    res.status(500).json({
      status: false, 
      message: error.message
    });
  }
};

/**
 * @description Update car details
 * @function updateCar
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Car ID to update
 * @param {Object} req.body - Fields to update
 * @param {string} [req.body.carName] - Updated car name
 * @param {number} [req.body.basePrice] - Updated base price
 * @param {number} [req.body.pricePerKm] - Updated price per kilometer
 * @param {number} [req.body.outStationCharges] - Updated out-station charges
 * @param {number} [req.body.finePercentage] - Updated fine percentage
 * @param {boolean} [req.body.isDisabled] - Updated disabled status
 * @param {Object} req.user - Authenticated user object from JWT middleware
 * @param {string} req.user._id - User ID of car owner
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with status and updated car
 */
let updateCar = async (req, res) => {
  try {
    // Deconstruct update fields from request body
    let {
      carName, 
      basePrice, 
      pricePerKm, 
      outStationCharges, 
      finePercentage, 
      isDisabled
    } = req.body;

    // Create update object with only provided fields
    let updateObject = {};

    if (carName !== undefined && carName !== null) updateObject.carName = carName;
    if (basePrice !== undefined && basePrice !== null) updateObject.basePrice = basePrice;
    if (pricePerKm !== undefined && pricePerKm !== null) updateObject.pricePerKm = pricePerKm;
    if (outStationCharges !== undefined && outStationCharges !== null) updateObject.outStationCharges = outStationCharges;
    if (finePercentage !== undefined && finePercentage !== null) updateObject.finePercentage = finePercentage;
    if (isDisabled !== undefined && isDisabled !== null) updateObject.isDisabled = isDisabled;

    // Create find object to ensure car belongs to the owner
    let findObject = {
      _id: req.params.id, 
      "owner._id": req.user._id
    };

    // Update car details
    let car = await Car.findOneAndUpdate(
      findObject, 
      { $set: updateObject }, 
      { new: true }
    );
    
    // Check if car exists and belongs to owner
    if (!car) return res.status(404).json({
      status: false, 
      message: "Car not found"
    });

    // Send success response
    res.status(200).json({
      status: true, 
      message: "Car updated", 
      car
    });
  }
  catch (error) {
    // Send error response
    res.status(500).json({
      status: false, 
      message: error.message
    });
  }
};

// Export controller functions
module.exports = { 
  addCar, 
  getCarById, 
  getCars, 
  deleteCar, 
  updateCar 
};