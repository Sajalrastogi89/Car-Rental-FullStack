/**
 * @description Passport JWT strategy configuration for API authentication
 * @module config/passport
 */

// Import required dependencies
const passport = require('passport');
const { Strategy, ExtractJwt } = require("passport-jwt");
const User = require('../models/user.model');

/**
 * JWT strategy configuration options
 * @type {Object}
 * @constant
 * @description Configuration settings for JWT authentication strategy
 * @property {Function} jwtFromRequest - Function to extract JWT from the request
 * @property {string} secretOrKey - Secret key to verify JWT signature
 * @property {boolean} ignoreExpiration - Whether to ignore token expiration status
 */
const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.ACCESS_TOKEN_SECRET,
  ignoreExpiration: false
};

/**
 * Configure and register the JWT strategy with Passport
 * @description Sets up JWT authentication verification process
 * The strategy verifies the token and retrieves the associated user
 */
passport.use(
  new Strategy(options, async (jwtPayload, done) => {
    try {
      // Find user by ID from JWT payload
      const user = await User.findById(jwtPayload.id);
      
      // Return user if found, otherwise return false
      if (user) return done(null, user);
      return done(null, false);
    } catch (error) {
      // Return error if user lookup fails
      return done(error, false);
    }
  })
);

// Export configured passport instance
module.exports = passport;
