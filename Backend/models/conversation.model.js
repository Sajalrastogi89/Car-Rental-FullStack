const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  message: {
    type: String,
  },
  imageUrl: {
    type: String,
  },
  isImage:{
    type:Boolean,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },
},
{
  timestamps: true,
});

module.exports = mongoose.model("Conversation", conversationSchema);