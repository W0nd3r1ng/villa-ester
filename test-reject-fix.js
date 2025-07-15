// Test script to verify reject booking functionality
const mongoose = require('mongoose');

// Connect to MongoDB (you'll need to update this with your connection string)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/villa-ester';

async function testRejectBooking() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Import the Booking model
    const Booking = require('./backend/models/Booking');

    // Find a pending booking to test with
    const pendingBooking = await Booking.findOne({ status: 'pending' });
    
    if (!pendingBooking) {
      console.log('No pending bookings found to test with');
      return;
    }

    console.log('Found pending booking:', {
      id: pendingBooking._id,
      name: pendingBooking.fullName,
      status: pendingBooking.status
    });

    // Test the reject method
    console.log('Testing reject method...');
    await pendingBooking.reject('Test rejection reason');
    
    console.log('Booking rejected successfully!');
    console.log('Updated booking:', {
      id: pendingBooking._id,
      name: pendingBooking.fullName,
      status: pendingBooking.status,
      rejectionReason: pendingBooking.rejectionReason,
      rejectedAt: pendingBooking.rejectedAt
    });

  } catch (error) {
    console.error('Error testing reject booking:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testRejectBooking(); 