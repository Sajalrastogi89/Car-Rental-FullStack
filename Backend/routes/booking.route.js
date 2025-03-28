const express =  require('express');
const { getAllBookings, updateBooking, getInvoice, getBookedDates, getBookingsByCarId, updateStartOdometer } = require('../controllers/booking.controller');
const authenticateJWT = require('../middlewares/jwtTokenAuthenticate');
const authorizeRoles = require('../middlewares/roleAuthenticate');


const router = express.Router();

router.get('/getAllBookings', authenticateJWT, getAllBookings);
router.patch('/updateBooking/:id', authenticateJWT, authorizeRoles("owner"), updateBooking);
router.get('/invoice/:id', authenticateJWT, getInvoice);
router.get('/bookedDates/:id', authenticateJWT, getBookedDates);
router.get('/getBookingsByCarId/:id', authenticateJWT, getBookingsByCarId);

module.exports = router; 