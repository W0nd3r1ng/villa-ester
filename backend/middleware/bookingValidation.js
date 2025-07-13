const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Validation rules for creating a booking
exports.validateCreateBooking = [
  body('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('cottageType')
    .notEmpty()
    .withMessage('Cottage type is required')
    .isIn(['kubo', 'With Videoke', 'Without Videoke', 'garden'])
    .withMessage('Invalid cottage type'),
  
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('bookingDate')
    .notEmpty()
    .withMessage('Booking date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const bookingDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (bookingDate < today) {
        throw new Error('Booking date cannot be in the past');
      }
      return true;
    }),
  
  body('bookingTime')
    .notEmpty()
    .withMessage('Booking time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format. Use HH:MM format'),
  
  body('duration')
    .notEmpty()
    .withMessage('Duration is required')
    .isInt({ min: 15, max: 1440 })
    .withMessage('Duration must be between 15 minutes and 24 hours'),
  
  body('numberOfPeople')
    .notEmpty()
    .withMessage('Number of people is required')
    .isInt({ min: 1, max: 50 })
    .withMessage('Number of people must be between 1 and 50'),
  
  body('contactPhone')
    .notEmpty()
    .withMessage('Contact phone is required')
    .matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/)
    .withMessage('Invalid phone number format'),
  
  body('contactEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('specialRequests')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Special requests cannot exceed 500 characters'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// Validation rules for updating a booking
exports.validateUpdateBooking = [
  param('id')
    .isMongoId()
    .withMessage('Invalid booking ID format'),
  
  body('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('cottageId')
    .optional()
    .isMongoId()
    .withMessage('Invalid cottage ID format'),
  
  body('cottageType')
    .optional()
    .isIn(['kubo', 'With Videoke', 'Without Videoke', 'garden'])
    .withMessage('Invalid cottage type'),
  
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('bookingDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const bookingDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (bookingDate < today) {
        throw new Error('Booking date cannot be in the past');
      }
      return true;
    }),
  
  body('bookingTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format. Use HH:MM format'),
  
  body('duration')
    .optional()
    .isInt({ min: 15, max: 1440 })
    .withMessage('Duration must be between 15 minutes and 24 hours'),
  
  body('numberOfPeople')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Number of people must be between 1 and 50'),
  
  body('contactPhone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Invalid phone number format'),
  
  body('contactEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'checked_out'])
    .withMessage('Invalid status value'),
  
  body('specialRequests')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Special requests cannot exceed 500 characters'),
  
  body('cancellationReason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Cancellation reason cannot exceed 200 characters'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  body('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'refunded', 'failed'])
    .withMessage('Invalid payment status value'),
  
  body('paymentMethod')
    .optional()
    .isIn(['credit_card', 'debit_card', 'paypal', 'cash', 'bank_transfer'])
    .withMessage('Invalid payment method value')
];

// Validation rules for cancelling a booking
exports.validateCancelBooking = [
  param('id')
    .isMongoId()
    .withMessage('Invalid booking ID format'),
  
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Cancellation reason cannot exceed 200 characters')
];

// Validation rules for getting bookings
exports.validateGetBookings = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'checked_out'])
    .withMessage('Invalid status value'),
  
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'bookingDate', 'status', 'totalPrice'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either "asc" or "desc"')
];

// Validation rules for getting booking by ID
exports.validateGetBookingById = [
  param('id')
    .isMongoId()
    .withMessage('Invalid booking ID format')
];

// Validation rules for deleting a booking
exports.validateDeleteBooking = [
  param('id')
    .isMongoId()
    .withMessage('Invalid booking ID format')
];

// Validation rules for getting bookings by user
exports.validateGetBookingsByUser = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'checked_out'])
    .withMessage('Invalid status value')
];

// Validation rules for getting booking statistics
exports.validateGetBookingStats = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
];

// Validation rules for checking availability
exports.validateCheckAvailability = [
  query('cottageId')
    .notEmpty()
    .withMessage('Cottage ID is required')
    .isMongoId()
    .withMessage('Invalid cottage ID format'),
  
  query('bookingDate')
    .notEmpty()
    .withMessage('Booking date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  query('bookingTime')
    .notEmpty()
    .withMessage('Booking time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format. Use HH:MM format')
];

// Validation rules for date range
exports.validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

// Validation rules for booking time slot
exports.validateBookingTimeSlot = [
  body('bookingDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('bookingTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format. Use HH:MM format'),
  
  body('duration')
    .optional()
    .isInt({ min: 15, max: 1440 })
    .withMessage('Duration must be between 15 minutes and 24 hours')
];

// Middleware to handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors found:', errors.array());
    console.log('Request body:', req.body);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
}; 