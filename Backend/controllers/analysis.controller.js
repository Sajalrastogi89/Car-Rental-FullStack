const mongoose = require('mongoose');
const Booking = require('../models/booking.model');
const User = require('../models/user.model');
const Car = require('../models/car.model');

let getOwnerAnalytics = async (req, res) => {
  try {

    const { startDate, endDate } = req.query;
    let ownerId = req.user._id;
    
    if (!ownerId || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Owner ID, start date, and end date are required' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Run all aggregations in parallel for better performance
    const [
      topCategories,
      topEarningCities, 
      topTravelledCities,
      topTravelledCategories,
      topBookedCars,
      bookingTrend
    ] =  await Promise.all([
      // total revenue per car category top 5
      Booking.aggregate([
        {
          $match: {
            "owner._id": ownerId,
            paymentStatus: "paid",
            startDate: { $gte: start, $lte: end },
          },
        },
        { $group: { _id: "$car.category", revenue: { $sum: "$totalAmount" } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id"},
            values: { $push: "$revenue"},
          }
        }
      ]),

      // top 5 highest earning cities
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
            labels: { $push: "$_id"},
            values: { $push: "$revenue"},
          }
        }
      ]),

      // top 5 highest travelled cities
      Booking.aggregate([
        {
          $match: {
            "owner._id": ownerId,
            paymentStatus: "paid",
            startDate: { $gte: start, $lte: end },
          },    
        },
        { $group: { _id: "$car.city", distance: { $sum: "$distanceTravelled" } } },
        { $sort: { distance: -1 } },
        { $limit: 5 },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id"},
            values: { $push: "$distance"},
          }
        }
      ]),

      // travelled with respect to category
      Booking.aggregate([
        {
          $match: {
            "owner._id": ownerId,
            paymentStatus: "paid",
            startDate: { $gte: start, $lte: end },
          },    
        },
        { $group: { _id: "$car.category", distance: { $sum: "$distanceTravelled" } } },
        { $sort: { distance: -1 } },
        { $limit: 5 },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id"},
            values: { $push: "$distance"},
          }
        }
      ]),

      // top 5 most booked cars
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
            labels: { $push: "$name"},
            values: { $push: "$count"},
          }
        }
      ]),

      // booking trend
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
            labels: { $push: "$_id"},
            values: { $push: "$count"},
          }
        }
      ])
    ]);

    return res.status(200).json({
      success: true,
      data: {
        topCategories,
        topEarningCities,
        topTravelledCities,
        topTravelledCategories,
        topBookedCars,
        bookingTrend
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching analytics data',
      error: error.message
    });
  }
};



const getAdminAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start date and end date are required' 
      });
    }

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
      userGrowth
    ] = await Promise.all([
      // Platform revenue summary 
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
            totalDistance: { $sum: "$distanceTravelled" }
          }
        },
        {
          $project: {
            _id: 0,
            totalRevenue: 1,
            avgBookingValue: 1,
            totalBookings: 1,
            totalDistance: 1
          }
        }
      ]),

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
            bookings: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $group: {
            _id: null,
            labels: { $push: "$ownerName" },
            values: { $push: "$revenue" },
            bookingCounts: { $push: "$bookings" }
          }
        }
      ]),

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
            bookings: { $sum: 1 }
          }
        },
        { $sort: { spent: -1 } },
        { $limit: 5 },
        {
          $group: {
            _id: null,
            labels: { $push: "$userName" },
            values: { $push: "$spent" },
            bookingCounts: { $push: "$bookings" }
          }
        }
      ]),

      // Bookings by status
      Booking.aggregate([
        {
          $match: {
            startDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: "$paymentStatus",
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },
            values: { $push: "$count" }
          }
        }
      ]),

      // Platform booking trend
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
            revenue: { $sum: "$totalAmount" }
          }
        },
        { $sort: { _id: 1 } },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },
            bookingValues: { $push: "$bookings" },
            revenueValues: { $push: "$revenue" }
          }
        }
      ]),

      // Car category distribution
      Car.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },
            values: { $push: "$count" }
          }
        }
      ]),

      // Cars by city
      Car.aggregate([
        {
          $group: {
            _id: "$city",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },
            values: { $push: "$count" }
          }
        }
      ]),

      // User growth over time (by registration date)
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            owners: { 
              $sum: { $cond: [ { $eq: [ "$role", "owner" ] }, 1, 0 ] }
            },
            renters: { 
              $sum: { $cond: [ { $eq: [ "$role", "renter" ] }, 1, 0 ] }
            }
          }
        },
        { $sort: { _id: 1 } },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },
            totalUsers: { $push: "$count" },
            ownerCounts: { $push: "$owners" },
            renterCounts: { $push: "$renters" }
          }
        }
      ])
    ]);

    // Calculate usage metrics
    const userCounts = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalCars = await Car.countDocuments();
    const avgCarsPerOwner = totalCars / (userCounts.find(u => u._id === 'owner')?.count || 1);

    return res.status(200).json({
      success: true,
      data: {
        revenueSummary: revenueSummary[0] || {
          totalRevenue: 0,
          avgBookingValue: 0,
          totalBookings: 0,
          totalDistance: 0
        },
        topOwners: topOwners[0] || { labels: [], values: [], bookingCounts: [] },
        topRenters: topRenters[0] || { labels: [], values: [], bookingCounts: [] },
        bookingsByStatus: bookingsByStatus[0] || { labels: [], values: [] },
        bookingTrend: bookingTrend[0] || { labels: [], bookingValues: [], revenueValues: [] },
        categoryDistribution: categoryDistribution[0] || { labels: [], values: [] },
        cityDistribution: cityDistribution[0] || { labels: [], values: [] },
        userGrowth: userGrowth[0] || { labels: [], totalUsers: [], ownerCounts: [], renterCounts: [] },
        platformMetrics: {
          totalOwners: userCounts.find(u => u._id === 'owner')?.count || 0,
          totalRenters: userCounts.find(u => u._id === 'renter')?.count || 0,
          totalCars,
          avgCarsPerOwner: parseFloat(avgCarsPerOwner.toFixed(2))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching analytics data',
      error: error.message
    });
  }
};


const bookingCountAnalysis = async (req, res) => {
  try {
    const owner_id = req.user._id;
    const bookingCount = await 
      // Bookings by status
      Booking.aggregate([
        {
          $match: {
            "owner._id": owner_id,
          },
        },
        {
          $group: {
            _id: "$paymentStatus",
            totalRevenue: { $sum: "$totalAmount" },
            count: { $sum: 1 }
          }
        }
      ])

    return res.status(200).json({
      success: true,
      data: bookingCount
    });
  }
  catch (error) {
    console.error('Error fetching admin analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching analytics data',
      error: error.message
    });
  }
}

module.exports = { getOwnerAnalytics, getAdminAnalytics, bookingCountAnalysis };


