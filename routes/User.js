const express = require('express');
const userRouter = express.Router();
const passport = require('passport');
const passportConfig = require('../passport');
const JWT = require('jsonwebtoken');
const User = require('../models/User');

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
  const { username, password, email, sex, role } = req.body;
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
          const newUser = new User({ username, password, email, sex, role });
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

module.exports = userRouter;