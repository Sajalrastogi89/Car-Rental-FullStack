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

// update values after trip completed and paid and update status
// update car travelled value then update booking status, distanceTravelled, totalAmount
let updateBooking = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    let id  = req.params.id;
    let { odometerValue } = req.body;
    let owner_id = req.user._id;

    let findObject = {
      _id: id,
      "owner._id": owner_id,
      paymentStatus: "pending",
    };

    let booking = await Booking.findOne(findObject);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
     
    let car = await Car.findById(booking.car._id);

    
    if(odometerValue <= car.travelled) {
      return res.status(400).json({status: false, message: "Odometer value cannot be less than or equal to previous value"});
    }


   
   
    booking.distanceTravelled = odometerValue - car.travelled;

    booking.totalAmount =
      booking.distanceTravelled * car.pricePerKm +
      ((booking.bidAmount + car.basePrice) *
        (booking.endDate - booking.startDate)) /
        (1000 * 60 * 60 * 24);

    booking.paymentStatus = "paid";

    booking.car.travelled = odometerValue;
    car.travelled = odometerValue;

   
    await car.save({ session });
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ status: true, car, booking });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ status: false, message: error });
  }
};


let getInvoice = async (req, res) => {
  try {
    let id = req.params.id;
    
    let findObject = {};

    findObject["_id"] = id;
    findObject["paymentStatus"] = "paid";

    if(req.user.role === "owner") {
      findObject["owner._id"] = req.user._id;
    }
    else if(req.user.role === "user") {
      findObject["user._id"] = req.user._id;
    }


    let booking
    = await Booking.findOne(findObject);
    if(!booking) return res.status(404).json({status: false, message: "Booking not found"});

    res.status(200).json({status: true, invoiceData: booking});
  }
  catch (error) {
    res.status(500).json({ message: error });
  }
}

module.exports = { getAllBookings, updateBooking, getInvoice };
