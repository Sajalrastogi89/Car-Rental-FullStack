/**
 * @description Role-based authentication middleware for access control
 * @module middlewares/roleAuthenticate
 */

/**
 * @description Middleware to check if the authenticated user has the required role
 * @function authorizeRoles
 * @param {...string} allowedRoles - List of roles that are permitted to access the route
 * @returns {Function} Express middleware function
 * @example
 * // Use in a route to restrict access to owners only
 * router.post('/resource', authenticateJWT, authorizeRoles('owner'), controller);
 * 
 * // Use in a route to restrict access to users only
 * router.post('/resource', authenticateJWT, authorizeRoles('user'), controller);
 * 
 * // Use in a route to allow multiple roles
 * router.post('/resource', authenticateJWT, authorizeRoles('admin', 'owner'), controller);
 */
const authorizeRoles = (...allowedRoles) => {
  /**
   * @description Express middleware function that checks user role
   * @param {Object} req - Express request object with authenticated user
   * @param {Object} req.user - User object from JWT authentication
   * @param {string} req.user.role - Role of the authenticated user
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {void|Object} Calls next() if authorized or returns 403 error
   */
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
};

// Export the middleware function
module.exports = authorizeRoles;
