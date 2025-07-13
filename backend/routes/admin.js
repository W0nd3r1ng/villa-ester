const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
// const { adminAuth } = require('../middleware/admin'); // Uncomment for real admin auth

// Bookings
router.get('/bookings', adminController.getAllBookings);
router.get('/booking/:id', adminController.getBookingById);
// Customers
router.get('/customers', adminController.getAllCustomers);
router.get('/customer/:id', adminController.getCustomerById);
// Reviews
router.get('/reviews', adminController.getAllReviews);
// Room Occupancy
router.get('/room-occupancy', adminController.getRoomOccupancy);
// Reports
router.get('/report/monthly', adminController.getMonthlyReport);

module.exports = router; 