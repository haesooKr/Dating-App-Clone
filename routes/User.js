const express = require('express');
const userRouter = express.Router();
const passport = require('passport');
const passportConfig = require('../passport');
const JWT = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');

require('dotenv').config();

function idCheck(req, res, next){
  const username = req.body.username;
  User.findOne({ username }, (err, doc) => {
    if(err){
      sendHTTPStatusAndJSON(res, 500);
    }
    if(!doc){
      res.status(401).json({ message: { isAuthenticated: false, user: { username: "", role: "" }, body: "Username does not exist", error: true }})
    } else {
      next();
    }
  })
}

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

userRouter.post('/login', idCheck, passport.authenticate('local', { session: false }), (req, res) => {
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

userRouter.get('/people', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { _id, username } = req.user;
  let passedUsers = [];
  await User.findOne({ username }, { likedUsers: 1, dislikedUsers: 1, superLikedUsers: 1 }, (err, doc) => {
    if(err){
      sendHTTPStatusAndJSON(res, 500);
    } else {
      passedUsers = [_id, ...doc.likedUsers, ...doc.dislikedUsers, ...doc.superLikedUsers]

      User.find({ _id: { $nin: passedUsers }}, { username: 1, firstName: 1, lastName: 1, sex: 1, essay: 1, pictures: 1}, (err, doc) => {
        if(err){
          sendHTTPStatusAndJSON(res, 500);
        } else {
          res.status(200).json({ people: doc, authenticated: true });
        }
      })
    }
  })
})

userRouter.get('/matches', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { username } = req.user;
  User.findOne({ username }).populate('matches', 'username firstName lastName sex essay pictures').exec((err, doc) => {
    if(err)
      sendHTTPStatusAndJSON(res, 500);
    else {
      res.status(200).json({ matches: doc.matches, authenticated: true });
    }
  })
})

userRouter.get('/rooms', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { username } = req.user;
  User.findOne({ username }, { rooms: 1 }, (err, doc) => {
    if(err)
      sendHTTPStatusAndJSON(res, 500);
    else
      res.status(200).json({ rooms: doc.rooms, authenticate: true });
  })
})

userRouter.post('/room', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { roomId } = req.body;
  Room.findOne({ _id: roomId }).populate('messages').exec((err, doc) => {
    if(err)
      sendHTTPStatusAndJSON(res, 500);
    else {
      res.status(200).json({ messages: doc.messages, authenticated: true });
    }
  })
})

userRouter.post('/sendMessage', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { username } = req.user;
  const { content, roomId } = req.body;
  const message = await Message.create({ sender: username, content });
  console.log(message);

  Room.findOneAndUpdate({ _id: roomId }, { $addToSet: { messages: message._id }}, (err, doc) => {
    if(err){
      sendHTTPStatusAndJSON(res,500);
    } else {
      console.log(doc);
      res.json({ body: "Successfully sent message", error: false })
    }
  });
})

module.exports = userRouter;