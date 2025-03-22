const mongoose = require('mongoose');

const carSubModelSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  carName: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  fuelType: {
    type: String,
    required: true,
    trim: true,
  },
  basePrice: {
    type: Number,
    required: true,
    min: 1,
  },
  pricePerKm: {
    type: Number,
    required: true,
    min: 1,
  },
  outStationCharges: {
    type: Number,
    required: true,
    min: 1,
  },
  travelled: {
    type: Number,
    default: 0,
    min: 0,
  },
  city: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  selectedFeatures: {
    type: Array,
    required: true,
  },
});

const userSubModelSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  role: {
    type: String,
    required: true,
    trim: true,
  },
});

const bookingSchema = new mongoose.Schema(
  {
    paymentStatus: {
      type: String,
      default: 'pending',
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    distanceTravelled: {
      type: Number,
      default: 0,
      min: 0,
    },
    bidAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    car: carSubModelSchema,
    user: userSubModelSchema,
    owner: userSubModelSchema,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);