const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const {
  validateCreateBooking,
  validateUpdateBooking,
  validateCancelBooking,
  validateGetBookings,
  validateGetBookingById,
  validateDeleteBooking,
  validateCheckAvailability,
  handleValidationErrors,
  validateDateRange,
  validateBookingTimeSlot
} = require('../middleware/bookingValidation');
const { auth } = require('../middleware/auth');
const { admin, requireRole } = require('../middleware/admin');

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings with filtering and pagination
 * @access  Public (for clerk panel)
 */
router.get('/',
  validateGetBookings,
  validateDateRange,
  handleValidationErrors,
  bookingController.getAllBookings
);

/**
 * @route   GET /api/bookings/availability
 * @desc    Check availability for a specific date and time
 * @access  Public
 */
router.get('/availability',
  validateCheckAvailability,
  handleValidationErrors,
  bookingController.checkAvailability
);

/**
 * @route   GET /api/bookings/date-range
 * @desc    Get bookings by date range
 * @access  Public
 */
router.get('/date-range',
  validateDateRange,
  handleValidationErrors,
  bookingController.getBookingsByDateRange
);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get a single booking by ID
 * @access  Private
 */
router.get('/:id',
  auth,
  validateGetBookingById,
  handleValidationErrors,
  bookingController.getBookingById
);

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking (public - no authentication required)
 * @access  Public
 */
router.post('/', 
  (req, res, next) => {
    console.log('POST /api/bookings route hit');
    console.log('Request headers:', req.headers);
    next();
  },
  bookingController.uploadProof, 
  (req, res, next) => {
    console.log('After file upload - body:', req.body);
    // Parse numeric fields from FormData
    if (req.body.duration) req.body.duration = parseInt(req.body.duration, 10);
    if (req.body.numberOfPeople) req.body.numberOfPeople = parseInt(req.body.numberOfPeople, 10);
    next();
  },
  validateCreateBooking,
  handleValidationErrors,
  bookingController.createBooking
);

/**
 * @route   PUT /api/bookings/:id
 * @desc    Update a booking
 * @access  Public (for clerk panel)
 */
router.put('/:id',
  validateUpdateBooking,
  validateBookingTimeSlot,
  handleValidationErrors,
  bookingController.updateBooking
);

/**
 * @route   PATCH /api/bookings/:id/cancel
 * @desc    Cancel a booking
 * @access  Private
 */
router.patch('/:id/cancel',
  auth,
  validateCancelBooking,
  handleValidationErrors,
  bookingController.cancelBooking
);

/**
 * @route   PATCH /api/bookings/:id/confirm
 * @desc    Confirm a booking
 * @access  Private (Admin/Clerk)
 */
router.patch('/:id/confirm',
  auth,
  requireRole(['admin', 'clerk']),
  handleValidationErrors,
  bookingController.confirmBooking
);

/**
 * @route   PATCH /api/bookings/:id/complete
 * @desc    Complete a booking
 * @access  Private (Admin/Clerk)
 */
router.patch('/:id/complete',
  auth,
  requireRole(['admin', 'clerk']),
  handleValidationErrors,
  bookingController.completeBooking
);

/**
 * @route   PATCH /api/bookings/:id/reject
 * @desc    Reject a booking
 * @access  Private (Admin/Clerk)
 */
router.patch('/:id/reject',
  auth,
  requireRole(['admin', 'clerk']),
  handleValidationErrors,
  bookingController.rejectBooking
);

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Delete a booking (admin only)
 * @access  Private (Admin)
 */
router.delete('/:id',
  auth,
  admin,
  validateDeleteBooking,
  handleValidationErrors,
  bookingController.deleteBooking
);

module.exports = router; 