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
const { auth, optionalAuth } = require('../middleware/auth');
const { admin, requireRole } = require('../middleware/admin');

// Development mode check
const isDevelopment = process.env.NODE_ENV !== 'production';

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
    
    // Find the cottage document for the specified type
    const Cottage = require('../models/cottage');
    const cottage = await Cottage.findOne({ type: cottageType, available: true });
    console.log('Found cottage:', cottage ? cottage.name : 'None');
    
    if (!cottage) {
      console.log('No cottage of this type available');
      return res.status(404).json({ success: false, message: 'No cottage of this type available' });
    }
    
    // Get total quantity for this cottage type
    const totalQuantity = cottage.quantity || 1;
    console.log('Total quantity for', cottageType, ':', totalQuantity);
    
    // Find all bookings for this type/date/time that are not cancelled/rejected
    const Booking = require('../models/Booking');
    
    // IMPROVED DATE HANDLING - Handle timezone issues
    let bookingDateStart, bookingDateEnd;
    
    try {
      // Parse the booking date more robustly
      const parsedDate = new Date(bookingDate);
      
      // Check if the date is valid
      if (isNaN(parsedDate.getTime())) {
        console.log('Invalid date format received:', bookingDate);
        return res.status(400).json({
          success: false,
          message: 'Invalid date format',
          receivedDate: bookingDate
        });
      }
      
      // Create start and end of the booking date for proper date comparison
      // Use UTC to avoid timezone issues
      bookingDateStart = new Date(parsedDate);
      bookingDateStart.setUTCHours(0, 0, 0, 0);
      
      bookingDateEnd = new Date(parsedDate);
      bookingDateEnd.setUTCHours(23, 59, 59, 999);
      
      console.log('Date range for query:', {
        start: bookingDateStart.toISOString(),
        end: bookingDateEnd.toISOString(),
        requestedDate: bookingDate,
        parsedDate: parsedDate.toISOString()
      });
    } catch (dateError) {
      console.error('Error parsing date:', dateError);
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
        error: dateError.message
      });
    }
    
    // Add timeout and retry logic for MongoDB queries
    const queryOptions = {
      maxTimeMS: 10000 // 10 second timeout
    };
    
    const existingBookings = await Booking.find({
      cottageType,
      bookingDate: { $gte: bookingDateStart, $lte: bookingDateEnd },
      bookingTime,
      status: { $nin: ['cancelled', 'rejected', 'checked_out'] }
    }, null, queryOptions).exec();
    
    console.log('Existing bookings for this date/time:', existingBookings.length);
    existingBookings.forEach((booking, index) => {
      console.log(`  ${index + 1}. ${booking.cottageType} #${booking.cottageNumber} - ${booking.bookingDate.toISOString()} at ${booking.bookingTime} (${booking.status})`);
    });
    
    // Get all assigned numbers
    const assignedNumbers = existingBookings.map(b => b.cottageNumber).filter(n => typeof n === 'number');
    console.log('Assigned numbers:', assignedNumbers);
    
    // List all available numbers (1 to totalQuantity)
    const availableNumbers = [];
    for (let i = 1; i <= totalQuantity; i++) {
      if (!assignedNumbers.includes(i)) {
        availableNumbers.push(i);
      }
    }
    console.log('Available numbers:', availableNumbers);
    
    // Add additional debugging info
    const response = { 
      success: true, 
      availableNumbers,
      totalQuantity,
      assignedNumbers,
      cottageType,
      debug: {
        dateRange: {
          start: bookingDateStart.toISOString(),
          end: bookingDateEnd.toISOString()
        },
        bookingCount: existingBookings.length,
        environment: process.env.NODE_ENV || 'development'
      }
    };
    
    console.log('Sending response:', response);
    res.json(response);
    
  } catch (error) {
    console.error('Error in cottage availability controller:', error);
    
    // Enhanced error response
    const errorResponse = {
      success: false, 
      message: 'Failed to fetch available cottage numbers', 
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    // Add stack trace in development
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.stack = error.stack;
    }
    
    res.status(500).json(errorResponse);
  }
});

/**
 * @route   GET /api/bookings/available-cottage-numbers
 * @desc    Get available cottage numbers for a specific type, date, and time
 * @access  Public
 */
router.get('/available-cottage-numbers',
  bookingController.getAvailableCottageNumbers
);

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings with filtering and pagination
 * @access  Public (for clerk panel) - uses optional auth in development
 */
router.get('/',
  isDevelopment ? optionalAuth : auth,
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
  optionalAuth,
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