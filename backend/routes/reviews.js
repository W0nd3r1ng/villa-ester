const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const {
  validateCreateReview,
  validateUpdateReview,
  validateGetReviews,
  validateGetReviewById,
  validateDeleteReview,
  validateToggleReviewApproval,
  handleValidationErrors
} = require('../middleware/reviewValidation');
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Public
 */
router.post('/', 
  validateCreateReview,
  handleValidationErrors,
  reviewController.createReview
);

/**
 * @route   GET /api/reviews
 * @desc    Get all approved reviews with pagination
 * @access  Public
 */
router.get('/',
  validateGetReviews,
  handleValidationErrors,
  reviewController.getReviews
);

/**
 * @route   GET /api/reviews/stats
 * @desc    Get review statistics
 * @access  Public
 */
router.get('/stats',
  reviewController.getReviewStats
);

/**
 * @route   GET /api/reviews/:id
 * @desc    Get a single review by ID
 * @access  Public
 */
router.get('/:id',
  validateGetReviewById,
  handleValidationErrors,
  reviewController.getReviewById
);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update a review (admin only)
 * @access  Private (Admin)
 */
router.put('/:id',
  auth,
  admin,
  validateUpdateReview,
  handleValidationErrors,
  reviewController.updateReview
);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review (admin only)
 * @access  Private (Admin)
 */
router.delete('/:id',
  auth,
  admin,
  validateDeleteReview,
  handleValidationErrors,
  reviewController.deleteReview
);

/**
 * @route   PATCH /api/reviews/:id/approval
 * @desc    Toggle review approval (admin only)
 * @access  Private (Admin)
 */
router.patch('/:id/approval',
  auth,
  admin,
  validateToggleReviewApproval,
  handleValidationErrors,
  reviewController.toggleReviewApproval
);

module.exports = router; 