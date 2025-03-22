const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
    trim: true,
    index: true,
  }
});

module.exports = mongoose.model('Category', categorySchema);