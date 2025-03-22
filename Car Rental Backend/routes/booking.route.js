const express =  require('express');
const { getAllBookings, updateBooking, getInvoice } = require('../controllers/booking.controller');
const authenticateJWT = require('../middlewares/jwtTokenAuthenticate');
const authorizeRoles = require('../middlewares/roleAuthenticate');


const router = express.Router();

router.get('/test',authenticateJWT, (req, res) => {
    res.send(`Booking route works ${req.user}`);
}
);
router.get('/getAllBookings', authenticateJWT, getAllBookings);
router.put('/updateBooking/:id', authenticateJWT, authorizeRoles("owner"), updateBooking);
router.get('/invoice/:id', authenticateJWT, getInvoice);


module.exports = router;