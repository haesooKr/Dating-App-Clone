const mongoose = require('mongoose');

const MessageSchema = mongoose.Schema({
  sender: {
    type: String,
    required: true
  },
  sender_username: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }
})

module.exports = mongoose.model('Message', MessageSchema, 'Messages');