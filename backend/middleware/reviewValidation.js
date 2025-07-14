const { body, param, query, validationResult } = require('express-validator');

// Validation rules for creating a review
exports.validateCreateReview = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('comment')
    .notEmpty()
    .withMessage('Comment is required')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Comment must be between 10 and 500 characters'),
  
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
];

// Validation rules for updating a review
exports.validateUpdateReview = [
  param('id')
    .isMongoId()
    .withMessage('Invalid review ID format'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Comment must be between 10 and 500 characters'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('isApproved')
    .optional()
    .isBoolean()
    .withMessage('isApproved must be a boolean value')
];

// Validation rules for getting reviews
exports.validateGetReviews = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
];

// Validation rules for getting review by ID
exports.validateGetReviewById = [
  param('id')
    .isMongoId()
    .withMessage('Invalid review ID format')
];

// Validation rules for deleting a review
exports.validateDeleteReview = [
  param('id')
    .isMongoId()
    .withMessage('Invalid review ID format')
];

// Validation rules for toggling review approval
exports.validateToggleReviewApproval = [
  param('id')
    .isMongoId()
    .withMessage('Invalid review ID format'),
  
  body('isApproved')
    .notEmpty()
    .withMessage('isApproved is required')
    .isBoolean()
    .withMessage('isApproved must be a boolean value')
];

// Middleware to handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
}; 