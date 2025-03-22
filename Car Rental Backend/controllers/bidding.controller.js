const Bid = require("../models/bidding.model");
const Car = require("../models/car.model");
const Booking = require("../models/booking.model");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

/**
 * @description Add a bid for a car
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} - Returns the added bid
 */
let addBid = async (req, res) => {
  try {

    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // deconstruct details from request body
    let { carId, bidAmount, startDate, endDate } = req.body;

    let findObject = {
      _id: carId,
      isDisabled: false,
    }

    // find car by id
    let carDetails = await Car.findOne(findObject);
    if (!carDetails) return res.status(404).json({ message: "Car not found" });

    // remove owner details from car object
    let ownerDetails = carDetails.owner;
    delete carDetails.owner;

    // create bidding object
    let biddingObject = {
      bidAmount,
      startDate,
      endDate,
      status: "pending",
      user: req.user,
      car: carDetails,
      owner: ownerDetails,
    };

    // save bid
    let bidding = new Bid(biddingObject);
    let addedBidding = await bidding.save();

    // send response
    res.status(201).json({ success: true, data: addedBidding });
  } catch (error) {
    // send error response
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @description Accept a bid
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} - Returns the added booking
 */
let acceptBid = async (req, res) => {
  try {
    // fetch bid id and owner id
    let id = req.params.id;
    let owner_id = req.user._id;

    // create find object
    let findObject = { _id: id, "owner._id": owner_id, status: "pending" };
    
    // add booking and delete overlapping bids
    let addedBooking = await addBookingAndDeleteOverlappingBids(findObject);
    if (!addedBooking)
      return res.status(404).json({ message: "Bid not found" });

    // send response
    res.status(200).json({ success: true, data: addedBooking });
  } catch (error) {
    // send error response
    res.status(500).json({ message: error.message });
  }
};

/**
 * @description Reject a bid
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} - Returns the updated bid
 */
let rejectBid = async (req, res) => {
  try {
    // fetch bid id and owner id
    const id = req.params.id;
    const owner_id = req.user._id;

    // creating find object
    const findObject = { _id: id, "owner._id": owner_id, status: "pending" };

    // update bid status to rejected
    const updatedBid = await Bid.findOneAndUpdate(
      findObject,
      { status: "rejected" },
      { new: true }
    );
    if (!updatedBid) return res.status(404).json({ message: "Bid not found" });

    // send response
    res.status(200).json({
      success: true,
      message: "Bid rejected successfully",
      data: updatedBid,
    });
  } catch (error) {
    // send error response
    res.status(500).json({
      success: false,
      message: "Failed to reject bid",
      error: error.message,
    });
  }
};

/**
 * @description Get all bids
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} - Returns all bids after applying filters, sorting and pagination
 */
let getAllBids = async (req, res) => {
  try {
    // deconstruct query parameters
    let {
      status,
      category,
      bidAmount,
      sortBy = "createdAt",
      sortOrder = -1,
      page = 1,
      limit = 10,
    } = req.query;

    // create query object
    let query = {};
    if (status) query.status = status;
    if (category) query["car.category"] = category;
    if (bidAmount) query.bidAmount = { $lte: parseInt(bidAmount) };

    let user = req.user;

    if (user.role === "owner") {
      query["owner._id"] = user._id;
    } else if (user.role === "user") {
      query["user._id"] = user._id;
    }

    // convert values from string to int
    page = parseInt(page);
    limit = parseInt(limit);
    sortOrder = parseInt(sortOrder);

    // create sort object
    let sortObject = {};
    sortObject[sortBy] = sortOrder;

    // aggregation pipeline for filtering, sorting, paginating
    const pipeline = [
      { $match: query },
      { $sort: sortObject },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    // get bids after applying filters, sorting and pagination
    let bids = await Bid.aggregate(pipeline);

    // send response
    res.status(200).json({ success: true, data: bids });
  } catch (error) {
    // send error response
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @description Add booking and delete overlapping bids
 * @param {object} findObject - Find object for bid
 * @returns {object} - Returns the added booking
 */
let addBookingAndDeleteOverlappingBids = async (findObject) => {
  const session = await mongoose.startSession();
  try {
    // start transaction
    session.startTransaction();

    // find bid
    let bid = await Bid.findOne(findObject);
    if (!bid) throw new Error("Bid not found");


    // check if bid is already rejected
    if (bid.status === "rejected") throw new Error("Bid already rejected");

    let bookingData = bid.toObject();

    let booking = new Booking(bookingData);
    let addedBooking = await booking.save({ session });
    await Bid.deleteMany(
      {
        "car._id": addedBooking.car._id,
        "startDate": { "$lte": addedBooking.endDate },
        "endDate": { "$gte": addedBooking.startDate },
        "status": "pending"
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return addedBooking;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(error.message);
  }
};

module.exports = { addBid, acceptBid, rejectBid, getAllBids };
