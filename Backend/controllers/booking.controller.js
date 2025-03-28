const Booking = require("../models/booking.model");
const mongoose = require("mongoose");
const Car = require("../models/car.model");

// getAllBookings for user and owner
let getAllBookings = async (req, res) => {
  try {
    let {
      status,
      category,
      sortBy = "createdAt",
      sortOrder = -1,
      page = 1,
      limit = 10,
    } = req.query;
    let query = {};
    if (status) query.status = status;
    if (category) query["car.category"] = category;

    let user = req.user;

    if (user.role === "owner") {
      query["owner._id"] = user._id;
    } else if (user.role === "user") {
      query["user._id"] = user._id;
    }

    page = parseInt(page);
    limit = parseInt(limit);
    sortOrder = parseInt(sortOrder);

    let sortObject = {};
    sortObject[sortBy] = sortOrder;

    const pipeline = [
      { $match: query },
      { $sort: sortObject },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const bookings = await Booking.aggregate(pipeline);
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

let getBookingsByCarId = async (req, res) => {
  try {
    let carId = req.params.id;
    let bookings = await Booking.find({ "car._id": carId });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error }); // return error message
  }
};


let getInvoice = async (req, res) => {
  try {
    let id = req.params.id;

    let findObject = {};

    findObject["_id"] = id;
    findObject["paymentStatus"] = "paid";

    if (req.user.role === "owner") {
      findObject["owner._id"] = req.user._id;
    } else if (req.user.role === "user") {
      findObject["user._id"] = req.user._id;
    }

    let booking = await Booking.findOne(findObject);
    if (!booking)
      return res
        .status(404)
        .json({ status: false, message: "Booking not found" });

    res.status(200).json({ status: true, invoiceData: booking });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

let getBookedDates = async (req, res) => {
  try {
    let carId = req.params.id;
    console.log("car_id", carId);
    let bookings = await Booking.find({ "car._id": carId });
    let dates = [];
    bookings.forEach((booking) => {
      let start = new Date(booking.startDate);
      let end = new Date(booking.endDate);
      let date = new Date(start);
      while (date <= end) {
        dates.push(date.toISOString().split("T")[0]);
        date.setDate(date.getDate() + 1);
      }
    });
    res.status(200).json({ status: true, dates });
  } catch (error) {
    res.status(500).json({ status: true, message: error });
  }
};


/**
 * Update booking odometer readings
 * Updates either start or end odometer reading based on the request
 * @param {object} req - Request with bookingId, carId, and odometerType (start/end)
 * @param {object} res - Response object
 */
let updateBooking = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    console.log("req.body", req.body);
    const { bookingId, odometerValue, odometerType, carId } = req.body;
    const owner_id = req.user._id;
    console.log(bookingId, odometerValue, odometerType, carId);

    if (!bookingId || !odometerValue || !odometerType || !carId) {
      return res.status(400).json({ 
        status: false, 
        message: "Missing required fields" 
      });
    }

    if (odometerType !== 'start' && odometerType !== 'end') {
      return res.status(400).json({
        status: false,
        message: "odometerType must be either 'start' or 'end'"
      });
    }

    // Find booking
    const findObject = {
      _id: bookingId,
      "owner._id": owner_id,
      paymentStatus: "pending"
    };

    const booking = await Booking.findOne(findObject).session(session);

    if (!booking) {
      return res.status(404).json({ 
        status: false, 
        message: "Booking not found or you don't have permission to update it" 
      });
    }

    // Find car
    const car = await Car.findById(carId).session(session);

    if (!car) {
      return res.status(404).json({ 
        status: false, 
        message: "Car not found" 
      });
    }

    // For start odometer reading
    if (odometerType === 'start') {
      // Validate odometer value
      if (odometerValue < car.travelled) {
        return res.status(400).json({
          status: false,
          message: `Start odometer reading cannot be less than car's current value (${car.travelled} km)`
        });
      }

      // Update booking and car
      booking.startOdometer = odometerValue;
      car.travelled = odometerValue;
      booking.car.travelled = odometerValue;
      
    } 
    // For end odometer reading
    else if (odometerType === 'end') {
      // Check if start odometer reading exists
      if (!booking.startOdometer) {
        return res.status(400).json({
          status: false,
          message: "Start odometer reading must be recorded before end reading"
        });
      }

      // Validate end odometer value
      if (odometerValue < booking.startOdometer) {
        return res.status(400).json({
          status: false,
          message: `End odometer reading cannot be less than start reading (${booking.startOdometer} km)`
        });
      }

      // Calculate distance traveled
      const distanceTravelled = odometerValue - booking.startOdometer;
      
      // Calculate days between start and end dates for regular rental period
      const days = Math.ceil((booking.endDate - booking.startDate) / (1000 * 60 * 60 * 24));
      
      // Calculate any late return days (if car is returned after the end date)
      const today = new Date();
      const endDate = new Date(booking.endDate);
      let lateDays = 0;
      
      if (today > endDate) {
        // Calculate number of days past the end date
        lateDays = Math.ceil((today - endDate) / (1000 * 60 * 60 * 24));
      }
      
      // Calculate fees
      const distanceFee = distanceTravelled * car.pricePerKm;
      const dailyFee = days * booking.bidAmount;
      
      // Calculate late fee (twice the bidAmount per late day)
      const finePerDay = booking.bidAmount + booking.bidAmount * ((car.finePercentage/ 100) || 0.5);
      const lateFee = lateDays * finePerDay;
      
      // Calculate total amount including any late fees
      const totalAmount = distanceFee + dailyFee + lateFee;

      // Update booking with all values
      booking.endOdometer = odometerValue;
      booking.distanceTravelled = distanceTravelled;
      booking.totalAmount = totalAmount;
      booking.paymentStatus = "paid";
      booking.lateDays = lateDays;
      booking.lateFee = lateFee;
      
      // Update car traveled value
      car.travelled = odometerValue;
      booking.car.travelled = odometerValue;
    }

    // Save updates
    await booking.save({ session });
    await car.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Send success response
    res.status(200).json({ 
      status: true, 
      message: `${odometerType === 'start' ? 'Start' : 'End'} odometer reading updated successfully`,
      data: {
        booking,
        car
      }
    });

  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    
    console.error("Error updating odometer reading:", error);
    res.status(500).json({ 
      status: false, 
      message: "Failed to update odometer reading",
      error: error.message 
    });
  }
};

module.exports = {
  getAllBookings,
  updateBooking,
  getInvoice,
  getBookedDates,
  getBookingsByCarId
};
