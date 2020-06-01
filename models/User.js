const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ObjectId = mongoose.Schema.Types.ObjectId;

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unqiue: true,
    min: 6,
    max: 15,
  },
  password : {
    type : String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
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
  pictures: [{type: ObjectId, ref: 'Picture'}],
  likedUsers: [{type: ObjectId, ref: 'User'}],
  dislikedUsers: [{type: ObjectId, ref: 'User'}],
  superLikedUsers: [{type: ObjectId, ref: 'User'}],
  likedBy: [{type: ObjectId, ref: 'User'}],
  messages: [{type: ObjectId, ref: 'Message'}]
})

UserSchema.pre('save', function(next){
  console.log("PRE SAVE")
  if(!this.isModified('password')){
    return next()
  }
  bcrypt.hash(this.password, 12, (err, hash) => {
    if(err){
      return next(err);
    }
    this.password = hash;
    next();
  })
})

UserSchema.methods.comparePassword = function(password, cb){
  console.log("COMPARE PASSWORD")
  bcrypt.compare(password, this.password, (err, same) => {
    if(err){
      return cb(err);
    } else {
      if(!same){
        return cb(null, same);
      }
      return cb(null, this);
    }
  })
}

module.exports = mongoose.model('User', UserSchema, 'Users');
