const Review = require('../models/Review');
const { validationResult } = require('express-validator');

/**
 * Create a new review
 */
exports.createReview = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, comment, image, rating } = req.body;
    
    // Create new review
    const review = new Review({
      name: name.trim(),
      comment: comment.trim(),
      image: image || '',
      rating: rating || 5,
      isApproved: true // Set to false if you want admin approval
    });

    const savedReview = await review.save();

    // Emit Socket.IO event for new review
    const io = req.app.get('io');
    if (io) {
      io.emit('review-created', {
        review: savedReview,
        message: 'New review submitted',
        timestamp: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      data: savedReview
    });
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: err.message
    });
  }
};

/**
 * Get all approved reviews
 */
exports.getReviews = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reviews = await Review.find({ isApproved: true })
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ isApproved: true });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: err.message
    });
  }
};

/**
 * Get a single review by ID
 */
exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (err) {
    console.error('Error fetching review:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review',
      error: err.message
    });
  }
};

/**
 * Update a review (admin only)
 */
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const review = await Review.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: err.message
    });
  }
};

/**
 * Delete a review (admin only)
 */
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: err.message
    });
  }
};

/**
 * Approve/Disapprove a review (admin only)
 */
exports.toggleReviewApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const review = await Review.findByIdAndUpdate(
      id,
      { isApproved },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: `Review ${isApproved ? 'approved' : 'disapproved'} successfully`,
      data: review
    });
  } catch (err) {
    console.error('Error toggling review approval:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update review approval',
      error: err.message
    });
  }
};

/**
 * Get review statistics
 */
exports.getReviewStats = async (req, res) => {
  try {
    const totalReviews = await Review.countDocuments();
    const approvedReviews = await Review.countDocuments({ isApproved: true });
    const averageRating = await Review.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalReviews,
        approvedReviews,
        pendingReviews: totalReviews - approvedReviews,
        averageRating: averageRating.length > 0 ? Math.round(averageRating[0].avgRating * 10) / 10 : 0
      }
    });
  } catch (err) {
    console.error('Error fetching review stats:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review statistics',
      error: err.message
    });
  }
}; 