const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  comment: { 
    type: String, 
    required: [true, 'Comment is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  image: { 
    type: String, 
    default: '',
    required: false
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    default: 5
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  isApproved: {
    type: Boolean,
    default: true // Set to false if you want admin approval
  }
}, {
  timestamps: true
});

// Index for better query performance
reviewSchema.index({ date: -1 });
reviewSchema.index({ isApproved: 1 });

// Virtual for formatted date
reviewSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

module.exports = mongoose.model('Review', reviewSchema); 