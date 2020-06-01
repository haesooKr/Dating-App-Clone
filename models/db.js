const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/Tinder", {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  useCreateIndex: true
}, (err) => {
  if(!err){
    console.log('MongoDB is connected successfully');
  } else {
    console.error(err);
  }
});

module.exports = mongoose;