const passport = require('passport');

const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = user;
    next(); 
  })(req, res, next);
};

module.exports = authenticateJWT;
