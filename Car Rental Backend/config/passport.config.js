const passport = require('passport');
const { Strategy, ExtractJwt } = require("passport-jwt");
const User = require('../models/user.model');


const cookieExtractor = req => {
  let jwt = null 

  if (req && req.cookies) {
      jwt = req.cookies['jwt']
  }

  return jwt;
}

const options = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.ACCESS_TOKEN_SECRET
};


passport.use(
  new Strategy(options, async (jwtPayload, done) => {
    try {

      const user = await User.findById(jwtPayload.id);
      
      if (user) return done(null, user);
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);


module.exports = passport; 
