const express = require('express');
const router = express.Router();
const { getOwnerAnalytics, getAdminAnalytics, bookingCountAnalysis } = require('../controllers/analysis.controller');
const authenticateToken  = require('../middlewares/jwtTokenAuthenticate');

// GET /api/analysis/owner
// Query params: ownerId, startDate, endDate
// Returns analytics data for a specific owner within a date range
router.get('/owner', authenticateToken, getOwnerAnalytics);
router.get('/admin', getAdminAnalytics);
router.get('/booking-count', authenticateToken, bookingCountAnalysis);

module.exports = router;