const express = require('express');
const passport = require('passport');
const passportConfig = require('../passport');
const JWT = require('jsonwebtoken');
const imageRouter = express.Router();
const Grid = require('gridfs-stream');
const User = require('../models/User')
const { mongoose, upload } = require('../models/db');

const conn = mongoose.connection;
const ObjectId = mongoose.Types.ObjectId;

let gfs;
conn.once('open', function () {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
})


// Upload Endpoint
imageRouter.post("/upload", passport.authenticate('jwt', { session: false }), upload.single('file'), (req, res) => {
  const { filename } = req.file;
  const username = req.user.username;
  User.findOneAndUpdate({ username }, { picture: filename }, ( err, doc ) => {
    if(err){
      res.status(500).json({ message: { body: "Error has occured", error: true }});
    } else {
      res.status(200).json({ filename })
    }
  })
});

//change picture router

imageRouter.get("/picture", passport.authenticate('jwt', { session: false }), (req, res) => {
  const username = req.user.username;
  User.findOne({ username }, { picture: 1 }, (err, doc) => {
    if(err){
      res.status(500).json({ message: { body: "Error has occured", error: true }});
    }
    const { picture } = doc;

    res.json({ picture })
  })
});

imageRouter.post('/delete', (req, res) => {
  const { _id } = req.body;
  gfs.files.deleteOne({ _id: new ObjectId( _id ) }, (err, file) => {
    mongoose.connection.db.collection('uploads.chunks', function(err, collection){
      collection.deleteMany({ files_id: new ObjectId( _id ) }, (err, file) => {
        res.json('Successfully Deleted Item')
      })
    })  
  })
})

imageRouter.get("/show/:filename", (req, res) => {
  gfs.files.findOne({filename: req.params.filename}, (err, file) => {
    if(!file || file.length === 0){
      return res.status(404).json({
        err: "No file exist"
      });
    }

    if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      })
    }
  })
});

module.exports = imageRouter;
