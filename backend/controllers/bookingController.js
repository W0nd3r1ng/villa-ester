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
    // Only allow userId filter for admin/clerk, otherwise always filter by current user
    if (req.user && req.user.role && (req.user.role === 'admin' || req.user.role === 'clerk')) {
      if (userId) filter.userId = userId;
    } else if (req.user && req.user._id) {
      filter.userId = req.user._id;
    }
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.bookingDate = {};
      if (startDate) filter.bookingDate.$gte = new Date(startDate);
      if (endDate) filter.bookingDate.$lte = new Date(endDate);
    }

    // Debug logging
    console.log('Booking history filter:', filter);

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

    // Debug logging
    console.log('Bookings found:', bookings.length);

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
    console.log('GCash Reference received:', req.body.gcashReference);
    console.log('Cottage Number received:', req.body.cottageNumber);
    console.log('Full req.body:', req.body);
    
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
      gcashReference
    } = req.body;

    // Block booking if phone number is already registered to a user other than the current user
    const User = require('../models/user');
    if (contactPhone) {
      const existingUser = await User.findOne({ phone: contactPhone });
      if (existingUser && (!req.user || existingUser._id.toString() !== req.user._id.toString())) {
        return res.status(409).json({
          success: false,
          message: 'This phone number is already registered to an account. Please log in to book.'
        });
      }
    }

    // Find the cottage document for the specified type
    const cottage = await Cottage.findOne({ type: cottageType, available: true });
    if (!cottage) {
      return res.status(404).json({
        success: false,
        message: 'No cottage of this type available'
      });
    }

    // Get total quantity for this cottage type
    const totalQuantity = cottage.quantity || 1;

    // Find all bookings for this type/date/time
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
    
    console.log('=== EXISTING BOOKINGS DEBUG ===');
    console.log('Date range:', { start: bookingDateStart.toISOString(), end: bookingDateEnd.toISOString() });
    console.log('Query criteria:', { cottageType, bookingTime, status: { $nin: ['cancelled', 'rejected', 'checked_out'] } });
    console.log('Found existing bookings:', existingBookings.length);
    existingBookings.forEach((booking, index) => {
      console.log(`  ${index + 1}. ${booking.cottageType} #${booking.cottageNumber} - ${booking.bookingDate.toISOString()} at ${booking.bookingTime} (${booking.status})`);
    });
    
    // Get all assigned numbers
    const assignedNumbers = existingBookings.map(b => b.cottageNumber).filter(n => typeof n === 'number');
    console.log('Assigned cottage numbers:', assignedNumbers);
    console.log('=== END EXISTING BOOKINGS DEBUG ===');

    // Use provided cottageNumber if given, else assign lowest available
    let cottageNumber = req.body.cottageNumber ? parseInt(req.body.cottageNumber, 10) : null;
    console.log('=== COTTAGE NUMBER DEBUG ===');
    console.log('Raw cottageNumber from req.body:', req.body.cottageNumber);
    console.log('Type of cottageNumber:', typeof req.body.cottageNumber);
    console.log('Parsed cottageNumber:', cottageNumber);
    console.log('Cottage number assignment:', {
      requestedNumber: req.body.cottageNumber,
      parsedNumber: cottageNumber,
      totalQuantity,
      assignedNumbers,
      cottageType,
      bookingDate,
      bookingTime
    });
    console.log('=== END COTTAGE NUMBER DEBUG ===');
    
    if (cottageNumber) {
      // Validate the requested cottage number
      console.log('=== COTTAGE NUMBER VALIDATION ===');
      console.log('Requested cottage number:', cottageNumber);
      console.log('Assigned numbers:', assignedNumbers);
      console.log('Total quantity:', totalQuantity);
      console.log('Is assigned:', assignedNumbers.includes(cottageNumber));
      console.log('Is too small:', cottageNumber < 1);
      console.log('Is too large:', cottageNumber > totalQuantity);
      
      if (assignedNumbers.includes(cottageNumber) || cottageNumber < 1 || cottageNumber > totalQuantity) {
        console.log('Cottage number validation failed:', {
          isAssigned: assignedNumbers.includes(cottageNumber),
          isTooSmall: cottageNumber < 1,
          isTooLarge: cottageNumber > totalQuantity
        });
        return res.status(409).json({
          success: false,
          message: 'Selected cottage number is not available.'
        });
      }
      console.log('Cottage number validation passed');
      console.log('=== END COTTAGE NUMBER VALIDATION ===');
    } else {
      // Assign the lowest available number (1-based)
      cottageNumber = 1;
      for (; cottageNumber <= totalQuantity; cottageNumber++) {
        if (!assignedNumbers.includes(cottageNumber)) break;
      }
      if (cottageNumber > totalQuantity) {
        console.log('No available cottage numbers found');
        return res.status(409).json({
          success: false,
          message: 'No available cottage number for this type at the selected time.'
        });
      }
    }
    
    console.log('Final assigned cottage number:', cottageNumber);

    // Create new booking
    let bookingUserId = req.user && req.user._id;
    // For walk-in bookings, we don't require a user ID
    if (!bookingUserId && req.body.status !== 'completed') {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    // Debug logging
    console.log('Creating booking for userId:', bookingUserId);
    // Ensure gcashReference is set to empty string if missing
    const safeGcashReference = typeof gcashReference === 'string' ? gcashReference : '';
    const booking = new Booking({
      userId: bookingUserId || null, // Allow null for walk-in bookings
      cottageId: cottage._id,
      cottageType,
      cottageNumber, // Save assigned number
      bookingDate,
      bookingTime,
      duration,
      numberOfPeople,
      specialRequests,
      contactPhone,
      contactEmail,
      notes,
      fullName,
      gcashReference: safeGcashReference,
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
    // Log after saving
    console.log('Booking saved. GCash Reference in DB:', savedBooking.gcashReference);

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
        // Format booking date and time for email
        const bookingDate = booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
        const bookingTime = booking.bookingTime || 'N/A';
        const contactNumber = '09228093074';
        await transporter.sendMail({
          from: `"Villa Ester Resort" <${process.env.EMAIL_USER}>`,
          to: booking.contactEmail,
          subject: 'Your Booking is Confirmed! - Villa Ester Resort',
          text: `Hi ${booking.fullName || 'Guest'},\n\nYour booking at Villa Ester Resort has been confirmed!\n\nBooking Date: ${bookingDate}\nBooking Time: ${bookingTime}\nCottage: ${booking.cottageType}${booking.cottageNumber ? ' #' + booking.cottageNumber : ''}\n\nFor more information, you may contact us at ${contactNumber}.\n\nNote: Upon cancellation, the down payment will not be refunded.\n\nThank you for choosing Villa Ester Resort!`,
          html: `<p>Hi <b>${booking.fullName || 'Guest'}</b>,</p><p>Your booking at <b>Villa Ester Resort</b> has been <b>confirmed</b>!</p><ul><li><b>Booking Date:</b> ${bookingDate}</li><li><b>Booking Time:</b> ${bookingTime}</li><li><b>Cottage:</b> ${booking.cottageType}${booking.cottageNumber ? ' #' + booking.cottageNumber : ''}</li></ul><p><b>For more information, you may contact us at <a href=\"tel:${contactNumber}\">${contactNumber}</a>.</b></p><p style=\"color:#d35400;\"><b>Note:</b> Upon cancellation, the down payment will not be refunded.</p><p>Thank you for choosing Villa Ester Resort!</p>`
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
      // Real-time update for user
      io.emit('booking-status-updated', {
        bookingId: booking._id,
        userId: booking.userId && booking.userId.toString(),
        status: booking.status,
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
      // Real-time update for user
      io.emit('booking-status-updated', {
        bookingId: booking._id,
        userId: booking.userId && booking.userId.toString(),
        status: booking.status,
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

// Add this new controller function
exports.getAvailableCottageNumbers = async (req, res) => {
  try {
    const { cottageType, bookingDate, bookingTime } = req.query;
    if (!cottageType || !bookingDate || !bookingTime) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }
    // Find all cottages of the specified type
    const Cottage = require('../models/cottage');
    const allCottages = await Cottage.find({ type: cottageType, available: true });
    if (!allCottages || allCottages.length === 0) {
      return res.status(404).json({ success: false, message: 'No cottages of this type available' });
    }
    // Use total quantity, not just number of docs
    const totalQuantity = allCottages.reduce((sum, c) => sum + (c.quantity || 1), 0);
    // Find all bookings for this type/date/time
    const Booking = require('../models/Booking');
    const existingBookings = await Booking.find({
      cottageType,
      bookingDate: new Date(bookingDate),
      bookingTime,
      status: { $nin: ['cancelled', 'rejected'] }
    });
    // Get all assigned numbers
    const assignedNumbers = existingBookings.map(b => b.cottageNumber).filter(n => typeof n === 'number');
    // List all available numbers
    const availableNumbers = [];
    for (let i = 1; i <= totalQuantity; i++) {
      if (!assignedNumbers.includes(i)) availableNumbers.push(i);
    }
    res.json({ success: true, availableNumbers });
  } catch (error) {
    console.error('Error fetching available cottage numbers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch available cottage numbers', error: error.message });
  }
}; 