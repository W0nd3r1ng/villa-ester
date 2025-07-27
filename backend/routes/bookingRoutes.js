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

// Cottage availability route - completely self-contained
router.get('/get-cottage-numbers', async (req, res) => {
  try {
    console.log('=== COTTAGE AVAILABILITY ROUTE HIT ===');
    console.log('Path:', req.path);
    console.log('Method:', req.method);
    console.log('Query params:', req.query);
    console.log('Headers:', req.headers);
    console.log('URL:', req.url);
    console.log('Original URL:', req.originalUrl);
    
    const { cottageType, bookingDate, bookingTime } = req.query;
    console.log('Extracted params:', { cottageType, bookingDate, bookingTime });
    
    if (!cottageType || !bookingDate || !bookingTime) {
      console.log('Missing required parameters');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters',
        received: { cottageType, bookingDate, bookingTime }
      });
    }
    
    // Find all cottages of the specified type
    const Cottage = require('../models/cottage');
    const allCottages = await Cottage.find({ type: cottageType, available: true });
    console.log('Found cottages:', allCottages.length);
    
    if (!allCottages || allCottages.length === 0) {
      console.log('No cottages of this type available');
      return res.status(404).json({ success: false, message: 'No cottages of this type available' });
    }
    
    // Use total quantity, not just number of docs
    const totalQuantity = allCottages.reduce((sum, c) => sum + (c.quantity || 1), 0);
    console.log('Total quantity:', totalQuantity);
    
    // Find all bookings for this type/date/time
    const Booking = require('../models/Booking');
    const existingBookings = await Booking.find({
      cottageType,
      bookingDate: new Date(bookingDate),
      bookingTime,
      status: { $nin: ['cancelled', 'rejected'] }
    });
    console.log('Existing bookings:', existingBookings.length);
    
    // Get all assigned numbers
    const assignedNumbers = existingBookings.map(b => b.cottageNumber).filter(n => typeof n === 'number');
    console.log('Assigned numbers:', assignedNumbers);
    
    // List all available numbers
    const availableNumbers = [];
    for (let i = 1; i <= totalQuantity; i++) {
      if (!assignedNumbers.includes(i)) availableNumbers.push(i);
    }
    console.log('Available numbers:', availableNumbers);
    
    res.json({ success: true, availableNumbers });
  } catch (error) {
    console.error('Error in cottage availability controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch available cottage numbers', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings with filtering and pagination
 * @access  Public (for clerk panel)
 */
router.get('/',
  auth,
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
  auth,
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