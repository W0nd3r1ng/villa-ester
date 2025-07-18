const Booking = require('../models/Booking');
const Cottage = require('../models/cottage');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const nodemailer = require('nodemailer');

// Configure transporter (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../uploads/proof');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage });

// Export the multer middleware for use in routes
exports.uploadProof = upload.single('proofOfPayment');

/**
 * Get all bookings with optional filtering and pagination
 */
exports.getAllBookings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      userId, 
      startDate, 
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (startDate || endDate) {
      filter.bookingDate = {};
      if (startDate) filter.bookingDate.$gte = new Date(startDate);
      if (endDate) filter.bookingDate.$lte = new Date(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const bookings = await Booking.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('cottageId', 'name price capacity type');

    // Get total count for pagination
    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

/**
 * Get a single booking by ID
 */
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate('userId', 'name email phone')
      .populate('cottageId', 'name price capacity type description');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: error.message
    });
  }
};

/**
 * Create a new booking
 */
exports.createBooking = async (req, res) => {
  try {
    // Debug: Log the received data
    console.log('Received booking data:', req.body);
    console.log('Received files:', req.file);
    
    // For FormData, we need to parse some fields as numbers
    const bookingData = {
      ...req.body,
      duration: parseInt(req.body.duration, 10),
      numberOfPeople: parseInt(req.body.numberOfPeople, 10)
    };
    
    console.log('Parsed booking data:', bookingData);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // If file uploaded, save its path
    let proofOfPaymentUrl = '';
    if (req.file) {
      proofOfPaymentUrl = `/uploads/proof/${req.file.filename}`;
    }

    const {
      userId,
      cottageType,
      bookingDate,
      bookingTime,
      duration,
      numberOfPeople,
      specialRequests,
      contactPhone,
      contactEmail,
      notes,
      fullName
    } = req.body;

    // Find cottage of the specified type
    const cottage = await Cottage.findOne({ type: cottageType, available: true });
    if (!cottage) {
      return res.status(404).json({
        success: false,
        message: 'Cottage type not found or not available'
      });
    }

    // Check if any cottage of this type is available for the time slot
    console.log('Checking availability for:', { cottageType, bookingDate, bookingTime });
    const isAvailable = await Booking.checkAvailabilityByType(cottageType, bookingDate, bookingTime);
    console.log('Availability result:', isAvailable);
    
    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'No cottages of this type are available for the selected date and time'
      });
    }

    // Create new booking
    const booking = new Booking({
      userId,
      cottageId: cottage._id,
      cottageType,
      bookingDate,
      bookingTime,
      duration,
      numberOfPeople,
      specialRequests,
      contactPhone,
      contactEmail,
      notes,
      fullName,
      proofOfPayment: proofOfPaymentUrl,
      totalPrice: cottage.price,
      status: req.body.status || 'pending',
      createdAt: new Date()
    });

    // Log if this is a walk-in booking
    if (booking.status === 'completed') {
      console.log('Creating walk-in booking - guest automatically checked in');
    }

    const savedBooking = await booking.save();

    // Populate the saved booking with user and cottage details
    const populatedBooking = await Booking.findById(savedBooking._id)
      .populate('userId', 'name email')
      .populate('cottageId', 'name price capacity type');

    // Emit Socket.IO event for new booking
    const io = req.app.get('io');
    if (io) {
      io.emit('booking-created', {
        booking: populatedBooking,
        message: 'New booking created',
        timestamp: new Date()
      });
    }

    const message = booking.status === 'completed' 
      ? 'Walk-in booking created successfully - guest automatically checked in'
      : 'Booking created successfully';

    res.status(201).json({
      success: true,
      message: message,
      data: populatedBooking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

/**
 * Update a booking
 */
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Find the booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // If updating date/time, check availability
    if (updateData.bookingDate || updateData.bookingTime) {
      const checkDate = updateData.bookingDate || booking.bookingDate;
      const checkTime = updateData.bookingTime || booking.bookingTime;
      const checkCottageId = updateData.cottageId || booking.cottageId;

      const existingBooking = await Booking.findOne({
        _id: { $ne: id }, // Exclude current booking
        cottageId: checkCottageId,
        bookingDate: checkDate,
        bookingTime: checkTime,
        status: { $nin: ['cancelled', 'rejected'] }
      });

      if (existingBooking) {
        return res.status(409).json({
          success: false,
          message: 'Cottage is not available for the selected date and time'
        });
      }
    }

    // Update the booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('userId', 'name email')
     .populate('cottageId', 'name price capacity type');

    // Emit Socket.IO event for booking update
    const io = req.app.get('io');
    if (io) {
      io.emit('booking-updated', {
        booking: updatedBooking,
        message: 'Booking updated',
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: error.message
    });
  }
};

/**
 * Delete a booking
 */
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be deleted (not completed)
    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a completed booking'
      });
    }

    await Booking.findByIdAndDelete(id);

    // Emit Socket.IO event for booking deletion
    const io = req.app.get('io');
    if (io) {
      io.emit('booking-deleted', {
        bookingId: id,
        message: 'Booking deleted',
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete booking',
      error: error.message
    });
  }
};

/**
 * Cancel a booking
 */
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await booking.cancel(reason);

    // Emit Socket.IO event for booking cancellation
    const io = req.app.get('io');
    if (io) {
      io.emit('booking-updated', {
        booking,
        message: 'Booking cancelled',
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
};

/**
 * Confirm a booking
 */
exports.confirmBooking = async (req, res) => {
  console.log("CONFIRM BOOKING ENDPOINT HIT", new Date().toISOString());
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await booking.confirm();

    // Send confirmation email if email exists
    if (booking.contactEmail) {
      try {
        await transporter.sendMail({
          from: `"Villa Ester Resort" <${process.env.EMAIL_USER}>`,
          to: booking.contactEmail,
          subject: 'Your Booking is Confirmed! - Villa Ester Resort',
          text: `Hi ${booking.fullName || 'Guest'},\n\nYour booking at Villa Ester Resort has been confirmed!\n\nBooking Date: ${booking.bookingDate}\nCottage: ${booking.cottageType}\n\nIf you need to cancel, please do so at least 3 days before your booking date to avoid any charges.\n\nThank you for choosing Villa Ester Resort!`,
          html: `<p>Hi <b>${booking.fullName || 'Guest'}</b>,</p><p>Your booking at <b>Villa Ester Resort</b> has been <b>confirmed</b>!</p><ul><li><b>Booking Date:</b> ${booking.bookingDate}</li><li><b>Cottage:</b> ${booking.cottageType}</li></ul><p style=\"color:#d35400;\"><b>Note:</b> If you need to cancel, please do so at least <b>3 days before</b> your booking date to avoid any charges.</p><p>Thank you for choosing Villa Ester Resort!</p>`
        });
        console.log('Confirmation email sent to', booking.contactEmail);
      } catch (emailErr) {
        console.error('Failed to send confirmation email:', emailErr);
      }
    }


    // Emit Socket.IO event for booking confirmation
    const io = req.app.get('io');
    if (io) {
      io.emit('booking-updated', {
        booking,
        message: 'Booking confirmed',
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm booking',
      error: error.message
    });
  }
};

/**
 * Complete a booking
 */
exports.completeBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await booking.complete();

    // Emit Socket.IO event for booking completion
    const io = req.app.get('io');
    if (io) {
      io.emit('booking-updated', {
        booking,
        message: 'Booking completed',
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Booking completed successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete booking',
      error: error.message
    });
  }
};

/**
 * Reject a booking
 */
exports.rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await booking.reject(reason);

    // Emit Socket.IO event for booking rejection
    const io = req.app.get('io');
    if (io) {
      io.emit('booking-updated', {
        booking,
        message: 'Booking rejected',
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Booking rejected successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject booking',
      error: error.message
    });
  }
};

/**
 * Get bookings by date range
 */
exports.getBookingsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, cottageId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const bookings = await Booking.getBookingsByDateRange(startDate, endDate, cottageId);

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings by date range',
      error: error.message
    });
  }
};

/**
 * Check cottage availability
 */
exports.checkAvailability = async (req, res) => {
  try {
    const { cottageId, cottageType, bookingDate, bookingTime } = req.query;

    if (!bookingDate || !bookingTime) {
      return res.status(400).json({
        success: false,
        message: 'Booking date and booking time are required'
      });
    }

    let isAvailable = false;
    let availableQuantity = 0;

    if (cottageId) {
      // Check availability for specific cottage
      isAvailable = await Booking.checkAvailability(cottageId, bookingDate, bookingTime);
    } else if (cottageType) {
      // Check availability for cottage type
      isAvailable = await Booking.checkAvailabilityByType(cottageType, bookingDate, bookingTime);
      availableQuantity = await Booking.getAvailableQuantity(cottageType, bookingDate, bookingTime);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either cottage ID or cottage type is required'
      });
    }

    res.json({
      success: true,
      available: isAvailable,
      availableQuantity: availableQuantity
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: error.message
    });
  }
}; 