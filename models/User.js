// [] DB SCHEMA - username, password, 
// pictures(array), address, description, sex, 
// likedUsers, superLikedUsers, disLikedUsers, 
// likedBy, messages ( message: user, content )

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ObjectId = mongoose.Schema.Types.ObjectId;

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 6,
    max: 15,
  },
  password : {
    type : String,
    required: true
  },
  sex: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  discription: {
    type: String,
    max: 100
  },
  pictures: [{type: ObjectId, ref: 'User'}],
  likedUsers: [{type: ObjectId, ref: 'User'}],
  dislikedUsers: [{type: ObjectId, ref: 'User'}],
  superLikedUsers: [{type: ObjectId, ref: 'User'}],
  likedBy: [{type: ObjectId, ref: 'User'}],
  messages: [{type: ObjectId, ref: 'Message'}]
})

UserSchema.pre('save', function(password, callback){
  bcrypt.compare(password, this.password, (err, isMatch) => {
    if(err){
      return cb(err);
    }
  })
})
