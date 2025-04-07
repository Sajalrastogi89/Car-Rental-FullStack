/**
 * @description Controller for managing bidding operations and bid workflow
 * @module controllers/bidding
 */

// Import required models and dependencies
const Bid = require("../models/bidding.model");
const Car = require("../models/car.model");
const Booking = require("../models/booking.model");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const mailService = require("../utils/mail");
const { sendBidToQueue } = require("../utils/sqs/producer");

/**
 * @description Create a new bid for a car
 * @function addBid
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing bid details
 * @param {string} req.body.carId - ID of the car to bid on
 * @param {number} req.body.bidAmount - Bid amount offered by the user
 * @param {string} req.body.startDate - Requested start date for the booking
 * @param {string} req.body.endDate - Requested end date for the booking
 * @param {string} req.body.tripType - Type of trip (local or outStation)
 * @param {Object} req.user - Authenticated user object from JWT middleware
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with status and bid data
 */
let addBid = async (req, res) => {
  try {
    // Validate request body using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
   
    // Extract details from request body
    let { carId, bidAmount, startDate, endDate, tripType } = req.body;

    // Create query object to find active car
    let findObject = {
      _id: carId,
      isDisabled: false,
    };

    // Find car by ID
    let carDetails = await Car.findOne(findObject);
    if (!carDetails) return res.status(404).json({ message: "Car not found" });

    // Extract owner details from car object
    let ownerDetails = carDetails.owner;
    delete carDetails.owner;
    
    // Create bidding object with all necessary information
    let biddingObject = {
      bidAmount,
      startDate,
      endDate,
      status: "pending",
      tripType,
      user: req.user,
      car: carDetails,
      owner: ownerDetails,
    };

   

    // Send bid to SQS queue for processing
    let sqs_response = await sendBidToQueue(biddingObject);

    // Send success response
    res.status(201).json({ 
      success: true, 
      data: sqs_response 
    });
  } catch (error) {
    // Send error response
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * @description Accept a bid and create a booking
 * @function acceptBid
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Bid ID to accept
 * @param {Object} req.user - Authenticated user object from JWT middleware
 * @param {string} req.user._id - User ID of car owner
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with booking and affected bids information
 */
let acceptBid = async (req, res) => {
  try {
    // Extract bid ID and owner ID
    let id = req.params.id;
    let owner_id = req.user._id;

    // Create query object to find pending bid owned by the current user
    let findObject = { 
      _id: id, 
      "owner._id": owner_id, 
      status: "pending" 
    };
  
    // Process bid acceptance, create booking and handle overlapping bids
    let result = await addBookingAndDeleteOverlappingBids(findObject);

    if (!result) return res.status(404).json({ 
      message: "Bid not found" 
    });

    let booking = result.booking;

    // Send email notification to user about bid acceptance
    mailService.sendBidAcceptedEmail({
      userEmail: booking.user.email,
      userName: booking.user.name,
      carName: booking.car.carName + " " + booking.car.category,
      bidAmount: booking.bidAmount,
      ownerName: booking.owner.name,
      ownerEmail: booking.owner.email,
      startDate: booking.startDate,
      endDate: booking.endDate,
      city: booking.car.city,
      image: booking.car.imageUrl,
    });

    // Send success response with all relevant information
    res.status(200).json({
      success: true,
      data: {
        booking: result.booking,
        acceptedBidId: result.acceptedBidId,
        rejectedBidIds: result.rejectedBidIds,
        rejectedCount: result.rejectedBidIds.length,
      },
    });
  } catch (error) {
    // Send error response
    res.status(500).json({ 
      message: error.message 
    });
  }
};

/**
 * @description Reject a bid
 * @function rejectBid
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Bid ID to reject
 * @param {Object} req.user - Authenticated user object from JWT middleware
 * @param {string} req.user._id - User ID of car owner
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with status and updated bid
 */
let rejectBid = async (req, res) => {
  try {
    // Extract bid ID and owner ID
    const id = req.params.id;
    const owner_id = req.user._id;

    // Create query object to find pending bid owned by the current user
    const findObject = { 
      _id: id, 
      "owner._id": owner_id, 
      status: "pending" 
    };

    // Update bid status to rejected
    const updatedBid = await Bid.findOneAndUpdate(
      findObject,
      { status: "rejected" },
      { new: true }
    );
    
    // Check if bid exists and belongs to the owner
    if (!updatedBid) return res.status(404).json({ 
      message: "Bid not found" 
    });

    let booking = updatedBid;

    // Send email notification to user about bid rejection
    mailService.sendBidRejectedEmail({
      userEmail: booking.user.email,
      userName: booking.user.name,
      carName: booking.car.carName + " " + booking.car.category,
      bidAmount: booking.bidAmount,
      ownerName: booking.owner.name,
      ownerEmail: booking.owner.email,
      startDate: booking.startDate,
      endDate: booking.endDate,
      city: booking.car.city,
      image: booking.car.imageUrl,
    });

    // Send success response
    res.status(200).json({
      success: true,
      message: "Bid rejected successfully",
      data: updatedBid,
    });
  } catch (error) {
    // Send error response
    res.status(500).json({
      success: false,
      message: "Failed to reject bid",
      error: error.message,
    });
  }
};

/**
 * @description Get all bids with filtering, sorting and pagination
 * @function getAllBids
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters for filtering and pagination
 * @param {string} [req.query.carName] - Filter by car name (partial match)
 * @param {string} [req.query.status] - Filter by bid status
 * @param {string} [req.query.sortBy=createdAt] - Field to sort by
 * @param {number} [req.query.sortOrder=-1] - Sort order (1 for ascending, -1 for descending)
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.limit=10] - Results per page
 * @param {Object} req.user - Authenticated user object from JWT middleware
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with filtered bids and metadata
 */
let getAllBids = async (req, res) => {
  try {
    // Extract query parameters with defaults
    let {
      carName,
      status,
      sortBy = "createdAt",
      sortOrder = -1,
      page = 1,
      limit = 10,
    } = req.query;

    // Create query object for filtering
    let query = {}; 
    
    // Add filters if provided
    if(carName && carName.trim()) {
      query["car.carName"] = { $regex: carName, $options: 'i' };
    }
    if (status) query.status = status;

    // Apply role-based filtering
    let user = req.user;
    if (user.role === "owner") {
      // Owners only see bids for their cars
      query["owner._id"] = user._id;
    } else if (user.role === "user") {
      // Users only see their own bids
      query["user._id"] = user._id;
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
    let bidsData = await Bid.aggregate(pipeline);
    
    // Extract metadata or provide defaults
    const metadata = bidsData[0].metadata[0] || { 
      total: 0, 
      page: page, 
      limit: limit 
    };
  
    // Send success response
    res.status(200).json({ 
      success: true, 
      bids: bidsData[0].data, 
      metadata: metadata 
    });
  } catch (error) {
    // Send error response
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * @description Helper function to accept a bid, create a booking, and reject overlapping bids
 * @function addBookingAndDeleteOverlappingBids
 * @param {Object} findObject - Query object to find the bid to accept
 * @returns {Object} Object containing booking, accepted bid ID, and rejected bid IDs
 * @throws {Error} If bid is not found or any other error occurs
 */
let addBookingAndDeleteOverlappingBids = async (findObject) => {
  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  
  try {
    // Start transaction to ensure atomicity
    session.startTransaction();

    // Update bid status to accepted
    let bid = await Bid.findOneAndUpdate(
      findObject,
      { status: "accepted" },
      { new: true, session }
    );
    
    // Validate bid exists
    if (!bid) throw new Error("Bid not found");

    const acceptedBidId = bid._id;

    // Find overlapping bids to reject
    const overlappingBids = await Bid.find(
      {
        "car._id": bid.car._id,
        startDate: { $lte: bid.endDate },
        endDate: { $gte: bid.startDate },
        status: "pending",
        _id: { $ne: acceptedBidId },
      },
      { _id: 1 }
    ).session(session);


    // Extract just the IDs of overlapping bids
    const rejectedBidIds = overlappingBids.map(b => b._id);

    // Update overlapping bids to rejected status
    if (rejectedBidIds.length > 0) {
      await Bid.updateMany(
        { _id: { $in: rejectedBidIds } },
        { status: "rejected" },
        { session }
      );
    }

    // Create a new booking based on the accepted bid
    let bookingData = bid.toObject();
    let booking = new Booking(bookingData);
    let addedBooking = await booking.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Return the results
    return {
      booking: addedBooking,
      acceptedBidId: acceptedBidId,
      rejectedBidIds: rejectedBidIds,
    };
  } catch (error) {
    // Abort transaction if any error occurs
    await session.abortTransaction();
    session.endSession();
    throw new Error(error.message);
  }
};

// Export controller functions
module.exports = { 
  addBid, 
  acceptBid, 
  rejectBid, 
  getAllBids 
};
