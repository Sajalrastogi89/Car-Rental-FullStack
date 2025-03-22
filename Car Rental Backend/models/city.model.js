const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  cityName: {
    type: String,
    required: true,
    trim: true,
    index: true,
  }
});

module.exports = mongoose.model('City', citySchema);