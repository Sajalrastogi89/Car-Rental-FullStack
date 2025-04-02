/**
 * @description Controller for managing analytics and data visualization operations
 * @module controllers/analysis
 */

// Import required dependencies
const mongoose = require("mongoose");
const Booking = require("../models/booking.model");
const User = require("../models/user.model");
const Car = require("../models/car.model");

/**
 * @description Generate analytics data for car owners about their fleet
 * @function getOwnerAnalytics
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.startDate - Start date for analytics period (YYYY-MM-DD)
 * @param {string} req.query.endDate - End date for analytics period (YYYY-MM-DD)
 * @param {Object} req.user - Authenticated user object from JWT middleware
 * @param {string} req.user._id - Owner ID to filter analytics data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with various owner analytics metrics
 */
let getOwnerAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let ownerId = req.user._id;

    // Validate required parameters
    if (!ownerId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Owner ID, start date, and end date are required",
      });
    }

    // Parse date strings to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Run all aggregations in parallel for better performance
    const [
      topCategories,
      topEarningCities,
      topTravelledCities,
      topTravelledCategories,
      topBookedCars,
      bookingTrend,
    ] = await Promise.all([
      // Total revenue per car category (top 5)
      Booking.aggregate([
        {
          $match: {
            "owner._id": ownerId,
            paymentStatus: "paid",
            startDate: { $gte: start, $lte: end },
          },
        },
        {
          $project: {
            car: 1,
            totalAmount: 1,
          },
        },
        { $group: { _id: "$car.category", revenue: { $sum: "$totalAmount" } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },
            values: { $push: "$revenue" },
          },
        },
      ]),

      // Top 5 highest earning cities
      Booking.aggregate([
        {
          $match: {
            "owner._id": ownerId,
            paymentStatus: "paid",
            startDate: { $gte: start, $lte: end },
          },
        },
        { $group: { _id: "$car.city", revenue: { $sum: "$totalAmount" } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },
            values: { $push: "$revenue" },
          },
        },
      ]),

      // Top 5 highest travelled cities (by distance)
      Booking.aggregate([
        {
          $match: {
            "owner._id": ownerId,
            paymentStatus: "paid",
            startDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: "$car.city",
            distance: { $sum: "$distanceTravelled" },
          },
        },
        { $sort: { distance: -1 } },
        { $limit: 5 },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },
            values: { $push: "$distance" },
          },
        },
      ]),

      // Distance travelled with respect to car category
      Booking.aggregate([
        {
          $match: {
            "owner._id": ownerId,
            paymentStatus: "paid",
            startDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: "$car.category",
            distance: { $sum: "$distanceTravelled" },
          },
        },
        { $sort: { distance: -1 } },
        { $limit: 5 },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },
            values: { $push: "$distance" },
          },
        },
      ]),

      // Top 5 most booked cars
      Booking.aggregate([
        {
          $match: {
            "owner._id": ownerId,
            startDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: "$car._id",
            count: { $sum: 1 },
            name: { $first: "$car.carName" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $group: {
            _id: null,
            labels: { $push: "$name" },
            values: { $push: "$count" },
          },
        },
      ]),

      // Booking trend over time (by date)
      Booking.aggregate([
        {
          $match: {
            "owner._id": ownerId,
            startDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$startDate" } },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },
            values: { $push: "$count" },
          },
        },
      ]),
    ]);

    // Return consolidated analytics data
    return res.status(200).json({
      success: true,
      data: {
        topCategories,
        topEarningCities,
        topTravelledCities,
        topTravelledCategories,
        topBookedCars,
        bookingTrend,
      },
    });
  } catch (error) {
    // Handle errors
    return res.status(500).json({
      success: false,
      message: "Error fetching analytics data",
      error: error.message,
    });
  }
};

/**
 * @description Generate platform-wide analytics data for administrators
 * @function getAdminAnalytics
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.startDate - Start date for analytics period (YYYY-MM-DD)
 * @param {string} req.query.endDate - End date for analytics period (YYYY-MM-DD)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with platform-wide analytics metrics
 */
const getAdminAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Parse date strings to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Run all aggregations in parallel for better performance
    const [
      revenueSummary,
      topOwners,
      topRenters,
      bookingsByStatus,
      bookingTrend,
      categoryDistribution,
      cityDistribution,
      userGrowth,
    ] = await Promise.all([
      // Platform revenue summary metrics
      Booking.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            startDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            avgBookingValue: { $avg: "$totalAmount" },
            totalBookings: { $sum: 1 },
            totalDistance: { $sum: "$distanceTravelled" },
          },
        },
        {
          $project: {
            _id: 0,
            totalRevenue: 1,
            avgBookingValue: 1,
            totalBookings: 1,
            totalDistance: 1,
          },
        },
      ]),

      // Top 5 revenue-generating car owners
      Booking.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            startDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: "$owner._id",
            ownerName: { $first: "$owner.name" },
            revenue: { $sum: "$totalAmount" },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $group: {
            _id: null,
            labels: { $push: "$ownerName" },
            values: { $push: "$revenue" },
            bookingCounts: { $push: "$bookings" },
          },
        },
      ]),

      // Top 5 spending renters
      Booking.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            startDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: "$user._id",
            userName: { $first: "$user.name" },
            spent: { $sum: "$totalAmount" },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { spent: -1 } },
        { $limit: 5 },
        {
          $group: {
            _id: null,
            labels: { $push: "$userName" },
            values: { $push: "$spent" },
            bookingCounts: { $push: "$bookings" },
          },
        },
      ]),

      // Bookings by payment status
      Booking.aggregate([
        {
          $match: {
            startDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: "$paymentStatus",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },
            values: { $push: "$count" },
          },
        },
      ]),

      // Platform booking trend over time
      Booking.aggregate([
        {
          $match: {
            startDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$startDate" } },
            bookings: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },
            bookingValues: { $push: "$bookings" },
            revenueValues: { $push: "$revenue" },
          },
        },
      ]),

      // Car category distribution
      Car.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },
            values: { $push: "$count" },
          },
        },
      ]),

      // Cars distribution by city (top 5)
      Car.aggregate([
        {
          $group: {
            _id: "$city",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },
            values: { $push: "$count" },
          },
        },
      ]),

      // User growth over time by registration date
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            owners: {
              $sum: { $cond: [{ $eq: ["$role", "owner"] }, 1, 0] },
            },
            renters: {
              $sum: { $cond: [{ $eq: ["$role", "renter"] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },
            totalUsers: { $push: "$count" },
            ownerCounts: { $push: "$owners" },
            renterCounts: { $push: "$renters" },
          },
        },
      ]),
    ]);

    // Calculate additional platform usage metrics
    const userCounts = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalCars = await Car.countDocuments();
    const avgCarsPerOwner =
      totalCars / (userCounts.find((u) => u._id === "owner")?.count || 1);

    // Return consolidated analytics data with fallbacks for empty results
    return res.status(200).json({
      success: true,
      data: {
        revenueSummary: revenueSummary[0] || {
          totalRevenue: 0,
          avgBookingValue: 0,
          totalBookings: 0,
          totalDistance: 0,
        },
        topOwners: topOwners[0] || {
          labels: [],
          values: [],
          bookingCounts: [],
        },
        topRenters: topRenters[0] || {
          labels: [],
          values: [],
          bookingCounts: [],
        },
        bookingsByStatus: bookingsByStatus[0] || { labels: [], values: [] },
        bookingTrend: bookingTrend[0] || {
          labels: [],
          bookingValues: [],
          revenueValues: [],
        },
        categoryDistribution: categoryDistribution[0] || {
          labels: [],
          values: [],
        },
        cityDistribution: cityDistribution[0] || { labels: [], values: [] },
        userGrowth: userGrowth[0] || {
          labels: [],
          totalUsers: [],
          ownerCounts: [],
          renterCounts: [],
        },
        platformMetrics: {
          totalOwners: userCounts.find((u) => u._id === "owner")?.count || 0,
          totalRenters: userCounts.find((u) => u._id === "renter")?.count || 0,
          totalCars,
          avgCarsPerOwner: parseFloat(avgCarsPerOwner.toFixed(2)),
        },
      },
    });
  } catch (error) {
    // Handle errors
    return res.status(500).json({
      success: false,
      message: "Error fetching analytics data",
      error: error.message,
    });
  }
};

/**
 * @description Get booking count analysis by payment status for an owner
 * @function bookingCountAnalysis
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object from JWT middleware
 * @param {string} req.user._id - Owner ID to filter booking data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with booking counts grouped by payment status
 */
const bookingCountAnalysis = async (req, res) => {
  try {
    const owner_id = req.user._id;
    
    // Aggregate bookings by payment status
    const bookingCount = await Booking.aggregate([
      {
        $match: {
          "owner._id": owner_id,
        },
      },
      {
        $group: {
          _id: "$paymentStatus",
          totalRevenue: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Return the aggregated data
    return res.status(200).json({
      success: true,
      data: bookingCount,
    });
  } catch (error) {
    // Handle errors
    return res.status(500).json({
      success: false,
      message: "Error fetching analytics data",
      error: error.message,
    });
  }
};

// Export controller functions
module.exports = { 
  getOwnerAnalytics, 
  getAdminAnalytics, 
  bookingCountAnalysis 
};
