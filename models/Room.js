const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

const RoomSchema = mongoose.Schema({
  participants: [{type: ObjectId, ref: 'User'}],
  messages: [{type: ObjectId, ref: 'Message'}]
})

module.exports = mongoose.model('Room', RoomSchema, "Rooms");