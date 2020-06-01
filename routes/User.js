const express = require('express');
const userRouter = express.Router();
const passport = require('passport');
const passportConfig = require('../passport');
const JWT = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');

require('dotenv').config();

const signToken = userID => {
  return JWT.sign({
    iss: process.env.SECRET,
    sub: userID
  }, process.env.SECRET, { expiresIn: "1h" })
}

const sendHTTPStatusAndJSON = (res, code, body, error) => {
  if(code === 500){
    return res.status(500).json({ message: { body: "Error has occured", error: true }})
  }
  return res.status(code).json({ message: { body, error }});
}

userRouter.post('/register', (req, res) => {
  const { username, firstName, lastName, password, email, sex, role, essay } = req.body;
  User.findOne({ username }, (err, user) => {
    if(err)
      sendHTTPStatusAndJSON(res, 500);
    if(user)
      sendHTTPStatusAndJSON(res, 400, "Username is already taken", true);
    else {
      User.findOne({ email }, (err, user) => {
        if(err)
          sendHTTPStatusAndJSON(res, 500)
        if(user)
          sendHTTPStatusAndJSON(res, 400, "Email is already taken", true);
        else {
          const newUser = new User({ username, firstName, lastName, password, email, sex, role, essay });
          newUser.save(err => {
            if(err){
              sendHTTPStatusAndJSON(res, 500);
            } else {
              sendHTTPStatusAndJSON(res, 201, "Account successfully created", false);
            }
          });
        }    
      })
    }
  })
});

userRouter.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
  if(req.isAuthenticated()){
    const { _id, username, role } = req.user;
    const token = signToken(_id);
    res.cookie('access_token', token, { httpOnly: true, sameSite: true });
    res.status(200).json({ isAuthenticated: true, user: { username, role }});
  }
});

userRouter.get('/logout', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.clearCookie('access_token');
  res.json({ user: { username: "", role: "" }, success: true })
});

userRouter.get('/admin', passport.authenticate('jwt', { session: false }), (req, res) => {
  if(req.user.role === 'admin'){
    res.status(200).json({ message: { body: "You are an admin", error: false }})
  } else {
    res.status(403).json({ message: { body: "You have no access to here", error: true }})
  }
});

userRouter.get('/authenticated', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { username, role } = req.user;
  res.status(200).json({ isAuthenticated: true, user: { username, role }});
});

userRouter.get('/profile', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { username, firstName, lastName, email, sex, essay } = req.user;
  
  res.status(200).json({ isAuthenticated: true, user: { username, email, firstName, lastName, sex, essay}})
})


userRouter.post('/update', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { username } = req.user;
  const { essay } = req.body;
  const filter = { username }
  const update = { essay }
  User.updateOne(filter, update, (err) => {
    if(err){
      sendHTTPStatusAndJSON(res, 500);
    } else {
      res.status(200).json({ body: "Successfully updated", error: false })
    }
  })
})


userRouter.get('/delete', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { _id } = req.user;
  User.deleteOne({ _id }, err => {
    if(err){
      sendHTTPStatusAndJSON(res, 500);
    } else {
      res.json({ body: "Successfully deleted account", error: false })
    }
  })
})

userRouter.get('/like/:username', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { _id, username } = req.user;
  const user = req.params.username;

  User.findOneAndUpdate({ username: user }, { $addToSet: { likedBy: _id }}, async (err, doc) => {
    if(err){
      sendHTTPStatusAndJSON(res, 500);
    } else {
      if(doc.likedUsers.indexOf(_id) > -1){
        // if the user also likes me
        const room = await Room.create({
          participants: [ _id, doc._id]
        });

        User.updateOne({ _id: doc._id }, { $addToSet: { matches: _id , rooms: room._id }}, (err) => {
          if(err){
            sendHTTPStatusAndJSON(res, 500);
          } else {
            User.updateOne({ username }, { $addToSet: { likedUsers: doc._id, matches: doc._id, rooms: room._id }}, (err) => {
              if(err){
                sendHTTPStatusAndJSON(res, 500);
              } else {
                sendHTTPStatusAndJSON(res, 200, "Successfully Matched", false);
              }
            })
          }
        });
      } else {
        User.updateOne({ username }, { $addToSet: { likedUsers: doc._id }}, (err) => {
          if(err){
            sendHTTPStatusAndJSON(res, 500);
          } else {
            sendHTTPStatusAndJSON(res, 200, "Successfully liked user", false);
          }
        })
      }
    }
  })
})

userRouter.get('/matches', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { username } = req.user;
  User.findOne({ username }).populate('matches', 'firstName lastName sex essay pictures').exec((err, doc) => {
    if(err)
      sendHTTPStatusAndJSON(res, 500);
    else {
      res.status(200).json({ matches: doc.matches, authenticated: true });
    }
  })
})

module.exports = userRouter;