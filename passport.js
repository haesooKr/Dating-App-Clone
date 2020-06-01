const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const User = require('./models/User');

require('dotenv').config();

const cookieExtractor = req => {
  let token = null;
  console.log("req.cookies", req.cookies)
  if(req & req.cookies){
    token = req.cookies["access_token"];
  }
  return token;
}

passport.use(new JwtStrategy({
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.SECRET;
}, (payload, done) => {
  console.log("payload", payload)
  User.findById({ _id : payload.sub }, (err, user) => {
    if(err)
      return done(err, false);
    if(user)
      return done(null, user);
    else
      return done(null, false);
  })
}))

passport.use(new LocalStrategy((username, password, done) => {
console.log("done", done)
  User.findOne({ username }, (err, user) => {
    if(err)
      return done(err);
    if(!user)
      return done(null, false);
    user.comparePassword(password, done);
  });
}));