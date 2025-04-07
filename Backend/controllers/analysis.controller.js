/**
 * @description Controller for managing analytics and data visualization operations
 * @module controllers/analysis
 */

// Import required dependencies
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

    // Execute all pipelines concurrently
    const [
      topCategoriesResult,
      topEarningCitiesResult,
      topTravelledCitiesResult,
      topTravelledCategoriesResult,
      topBookedCarsResult,
      bookingTrendResult,
      tripTypeAnalysisResult,
      lateReturnsAnalysisResult,
      mileageAnalysisResult,
      biddingAnalysisResult
    ] = await Promise.allSettled([
      // Top Categories Pipeline
      Booking.aggregate([
        { 
          $match: { 
            "owner._id": ownerId,
            startDate: { $gte: start, $lte: end },
            paymentStatus: "paid" 
          } 
        },
        { $project: { "car.category": 1, totalAmount: 1 } },
        { $group: { _id: "$car.category", revenue: { $sum: "$totalAmount" } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $group: { _id: null, labels: { $push: "$_id" }, values: { $push: "$revenue" } } }
      ]),

      // Top Earning Cities Pipeline
      Booking.aggregate([
        { 
          $match: { 
            "owner._id": ownerId,
            startDate: { $gte: start, $lte: end },
            paymentStatus: "paid" 
          } 
        },
        { $project: { "car.city": 1, totalAmount: 1 } },
        { $group: { _id: "$car.city", revenue: { $sum: "$totalAmount" } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $group: { _id: null, labels: { $push: "$_id" }, values: { $push: "$revenue" } } }
      ]),

      // Top Travelled Cities Pipeline
      Booking.aggregate([
        { 
          $match: { 
            "owner._id": ownerId,
            startDate: { $gte: start, $lte: end },
            paymentStatus: "paid" 
          } 
        },
        { $project: { "car.city": 1, distanceTravelled: 1 } },
        { $group: { _id: "$car.city", distance: { $sum: "$distanceTravelled" } } },
        { $sort: { distance: -1 } },
        { $limit: 5 },
        { $group: { _id: null, labels: { $push: "$_id" }, values: { $push: "$distance" } } }
      ]),

      // Top Travelled Categories Pipeline
      Booking.aggregate([
        { 
          $match: { 
            "owner._id": ownerId,
            startDate: { $gte: start, $lte: end },
            paymentStatus: "paid" 
          } 
        },
        { $project: { "car.category": 1, distanceTravelled: 1 } },
        { $group: { _id: "$car.category", distance: { $sum: "$distanceTravelled" } } },
        { $sort: { distance: -1 } },
        { $limit: 5 },
        { $group: { _id: null, labels: { $push: "$_id" }, values: { $push: "$distance" } } }
      ]),

      // Top Booked Cars Pipeline
      Booking.aggregate([
        { 
          $match: { 
            "owner._id": ownerId,
            startDate: { $gte: start, $lte: end }
          } 
        },
        { $project: { "car._id": 1, "car.carName": 1 } },
        { $group: { _id: "$car._id", count: { $sum: 1 }, name: { $first: "$car.carName" } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $group: { _id: null, labels: { $push: "$name" }, values: { $push: "$count" } } }
      ]),

      // Booking Trend Pipeline
      Booking.aggregate([
        { 
          $match: { 
            "owner._id": ownerId,
            startDate: { $gte: start, $lte: end }
          } 
        },
        { $project: { startDate: 1 } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$startDate" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $group: { _id: null, labels: { $push: "$_id" }, values: { $push: "$count" } } }
      ]),

      // Trip Type Analysis Pipeline
      Booking.aggregate([
        { 
          $match: { 
            "owner._id": ownerId,
            startDate: { $gte: start, $lte: end },
            paymentStatus: "paid" 
          } 
        },
        {
          $group: {
            _id: "$tripType",
            totalBookings: { $sum: 1 },
            avgRevenue: { $avg: "$totalAmount" },
            totalRevenue: { $sum: "$totalAmount" },
            avgDistance: { $avg: "$distanceTravelled" },
            avgBidAmount: { $avg: "$bidAmount" }
          }
        },
        {
          $project: {
            _id: 0,
            tripType: "$_id",
            metrics: {
              totalBookings: "$totalBookings",
              avgRevenue: { $round: ["$avgRevenue", 2] },
              totalRevenue: "$totalRevenue",
              avgDistance: { $round: ["$avgDistance", 2] },
              avgBidAmount: { $round: ["$avgBidAmount", 2] }
            }
          }
        }
      ]),

      // Late Returns Analysis Pipeline
      Booking.aggregate([
        { 
          $match: { 
            "owner._id": ownerId,
            startDate: { $gte: start, $lte: end },
            lateDays: { $gt: 0 }, 
            paymentStatus: "paid" 
          } 
        },
        {
          $group: {
            _id: null,
            totalLateReturns: { $sum: 1 },
            avgLateDays: { $avg: "$lateDays" },
            totalLateFees: { $sum: "$lateFee" },
            maxLateDays: { $max: "$lateDays" }
          }
        },
        {
          $project: {
            _id: 0,
            totalLateReturns: 1,
            avgLateDays: { $round: ["$avgLateDays", 1] },
            totalLateFees: 1,
            maxLateDays: 1
          }
        }
      ]),

      // Mileage Analysis Pipeline
      Booking.aggregate([
        { 
          $match: { 
            "owner._id": ownerId,
            startDate: { $gte: start, $lte: end },
            paymentStatus: "paid" 
          } 
        },
        {
          $group: {
            _id: "$car._id",
            carName: { $first: "$car.carName" },
            totalTrips: { $sum: 1 },
            totalDistance: { $sum: { $subtract: ["$endOdometer", "$startOdometer"] } },
            avgTripDistance: { $avg: { $subtract: ["$endOdometer", "$startOdometer"] } },
            maxTripDistance: { $max: { $subtract: ["$endOdometer", "$startOdometer"] } }
          }
        },
        {
          $project: {
            _id: 0,
            carName: 1,
            metrics: {
              totalTrips: "$totalTrips",
              totalDistance: "$totalDistance",
              avgTripDistance: { $round: ["$avgTripDistance", 2] },
              maxTripDistance: "$maxTripDistance"
            }
          }
        },
        { $sort: { "metrics.totalDistance": -1 } }
      ]),

      // Bidding Analysis Pipeline
      Booking.aggregate([
        { 
          $match: { 
            "owner._id": ownerId,
            startDate: { $gte: start, $lte: end }
          } 
        },
        {
          $group: {
            _id: {
              month: { $month: "$startDate" },
              year: { $year: "$startDate" }
            },
            avgBidAmount: { $avg: "$bidAmount" },
            maxBidAmount: { $max: "$bidAmount" },
            minBidAmount: { $min: "$bidAmount" },
            totalBids: { $sum: 1 },
            successfulBids: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0]
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            period: {
              $concat: [
                { $toString: "$_id.year" },
                "-",
                { $toString: "$_id.month" }
              ]
            },
            metrics: {
              avgBidAmount: { $round: ["$avgBidAmount", 2] },
              maxBidAmount: "$maxBidAmount",
              minBidAmount: "$minBidAmount",
              totalBids: "$totalBids",
              successRate: {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$successfulBids", "$totalBids"] },
                      100
                    ]
                  },
                  1
                ]
              }
            }
          }
        },
        { $sort: { period: 1 } }
      ])
    ]);

    // Extract results with error handling
    const results = {
      topCategories: topCategoriesResult.status === 'fulfilled' ? topCategoriesResult.value[0] : null,
      topEarningCities: topEarningCitiesResult.status === 'fulfilled' ? topEarningCitiesResult.value[0] : null,
      topTravelledCities: topTravelledCitiesResult.status === 'fulfilled' ? topTravelledCitiesResult.value[0] : null,
      topTravelledCategories: topTravelledCategoriesResult.status === 'fulfilled' ? topTravelledCategoriesResult.value[0] : null,
      topBookedCars: topBookedCarsResult.status === 'fulfilled' ? topBookedCarsResult.value[0] : null,
      bookingTrend: bookingTrendResult.status === 'fulfilled' ? bookingTrendResult.value[0] : null,
      tripTypeAnalysis: tripTypeAnalysisResult.status === 'fulfilled' ? tripTypeAnalysisResult.value : [],
      lateReturnsAnalysis: lateReturnsAnalysisResult.status === 'fulfilled' ? lateReturnsAnalysisResult.value[0] : {
        totalLateReturns: 0,
        avgLateDays: 0,
        totalLateFees: 0,
        maxLateDays: 0
      },
      mileageAnalysis: mileageAnalysisResult.status === 'fulfilled' ? mileageAnalysisResult.value : [],
      biddingAnalysis: biddingAnalysisResult.status === 'fulfilled' ? biddingAnalysisResult.value : []
    };

    // Return consolidated analytics data
    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching analytics data",
      error: error.message
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
    ] = await Promise.allSettled([
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
              $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] },
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
        revenueSummary: revenueSummary.status === 'fulfilled' ? revenueSummary.value[0] : null,
        topOwners: topOwners.status === 'fulfilled' ? topOwners.value[0] : null,
        topRenters: topRenters.status === 'fulfilled' ? topRenters.value[0] : null,
        bookingsByStatus: bookingsByStatus.status === 'fulfilled' ? bookingsByStatus.value[0] : null,
        bookingTrend: bookingTrend.status === 'fulfilled' ? bookingTrend.value[0] : null,
        categoryDistribution: categoryDistribution.status === 'fulfilled' ? categoryDistribution.value[0] : null,
        cityDistribution: cityDistribution.status === 'fulfilled' ? cityDistribution.value[0] : null,
        userGrowth: userGrowth.status === 'fulfilled' ? userGrowth.value[0] : null,
        platformMetrics: {
          totalOwners: userCounts.find((u) => u._id === "owner")?.count || 0,
          totalRenters: userCounts.find((u) => u._id === "user")?.count || 0,
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

    // Simple aggregation pipeline without $facet
    const analytics = await Booking.aggregate([
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
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    // Return the aggregated data directly
    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
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
  bookingCountAnalysis,
};
