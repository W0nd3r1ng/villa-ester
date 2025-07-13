const mongoose = require('mongoose');

const cottageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Cottage name is required']
  },
  description: {
    type: String,
    required: [true, 'Cottage description is required']
  },
  price: {
    type: Number,
    required: [true, 'Cottage price is required'],
    min: [0, 'Price cannot be negative']
  },
  capacity: {
    type: String,
    required: [true, 'Cottage capacity is required']
  },
  amenities: [{
    type: String
  }],
  image: {
    type: String,
    required: [true, 'Cottage image is required']
  },
  available: {
    type: Boolean,
    default: true
  },
  quantity: {
    type: Number,
    required: [true, 'Cottage quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  type: {
    type: String,
    required: [true, 'Cottage type is required']
  }
}, {
  timestamps: true
});

// Index for better query performance
cottageSchema.index({ type: 1, available: 1 });
cottageSchema.index({ price: 1 });

module.exports = mongoose.model('Cottage', cottageSchema); 