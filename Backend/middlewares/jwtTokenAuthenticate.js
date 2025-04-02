/**
 * @description JWT authentication middleware for verifying user tokens
 * @module middlewares/jwtTokenAuthenticate
 */

// Import required dependencies
const passport = require('passport');

/**
 * @description Middleware to authenticate requests using JSON Web Tokens
 * @function authenticateJWT
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * @example
 * // Use in a route to protect resources
 * router.get('/protected-resource', authenticateJWT, controller);
 * 
 * // Use with role authentication for additional protection
 * router.post('/owner-resource', authenticateJWT, authorizeRoles('owner'), controller);
 */
const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    // Handle server errors
    if (err) return res.status(500).json({ message: 'Internal server error', error: err });
    
    // Handle authentication failure
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    
    // Add user object to request for use in subsequent middleware
    req.user = user; 
    next(); 
  })(req, res, next);
};

// Export the middleware function
module.exports = authenticateJWT;
