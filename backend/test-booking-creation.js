const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Cottage = require('./models/cottage');
require('dotenv').config();

async function testBookingCreation() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Test data
    const testBookingData = {
      cottageType: 'kubo',
      bookingDate: '2025-07-29',
      bookingTime: '08:00',
      cottageNumber: 2, // Try to assign cottage #2
      duration: 600,
      numberOfPeople: 5,
      specialRequests: 'Test booking',
      contactPhone: '09999999999',
      contactEmail: 'test@test.com',
      fullName: 'Test User',
      notes: 'Test booking for cottage #2'
    };

    console.log('Test booking data:', testBookingData);

    // Check existing bookings for this date/time
    const bookingDateStart = new Date(testBookingData.bookingDate);
    bookingDateStart.setHours(0, 0, 0, 0);
    const bookingDateEnd = new Date(testBookingData.bookingDate);
    bookingDateEnd.setHours(23, 59, 59, 999);

    const existingBookings = await Booking.find({
      cottageType: testBookingData.cottageType,
      bookingDate: { $gte: bookingDateStart, $lte: bookingDateEnd },
      bookingTime: testBookingData.bookingTime,
      status: { $nin: ['cancelled', 'rejected'] }
    });

    console.log('Existing bookings for this date/time:', existingBookings.length);
    existingBookings.forEach((booking, index) => {
      console.log(`  ${index + 1}. ${booking.cottageType} #${booking.cottageNumber} - ${booking.bookingDate.toISOString()} at ${booking.bookingTime} (${booking.status})`);
    });

    // Get assigned numbers
    const assignedNumbers = existingBookings.map(b => b.cottageNumber).filter(n => typeof n === 'number');
    console.log('Assigned cottage numbers:', assignedNumbers);

    // Check if requested number is available
    const requestedNumber = testBookingData.cottageNumber;
    if (assignedNumbers.includes(requestedNumber)) {
      console.log(`❌ Cottage #${requestedNumber} is already assigned`);
    } else {
      console.log(`✅ Cottage #${requestedNumber} is available`);
    }

    // Get cottage info
    const cottage = await Cottage.findOne({ type: testBookingData.cottageType });
    if (cottage) {
      console.log(`Cottage info: ${cottage.name} - Quantity: ${cottage.quantity}`);
      
      // Show all available numbers
      const availableNumbers = [];
      for (let i = 1; i <= cottage.quantity; i++) {
        if (!assignedNumbers.includes(i)) {
          availableNumbers.push(i);
        }
      }
      console.log('Available cottage numbers:', availableNumbers);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

testBookingCreation(); 