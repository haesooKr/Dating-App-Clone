const mongoose = require('mongoose');

const MessageSchema = mongoose.Schema({
  sender: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('Message', MessageSchema);