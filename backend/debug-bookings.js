const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Cottage = require('./models/cottage');
require('dotenv').config();

async function debugBookings() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Check all existing bookings
    console.log('\n=== ALL EXISTING BOOKINGS ===');
    const allBookings = await Booking.find({}).sort({ createdAt: -1 });
    console.log('Total bookings:', allBookings.length);
    
    allBookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.cottageType} #${booking.cottageNumber} - ${booking.bookingDate.toISOString().slice(0, 10)} at ${booking.bookingTime} (${booking.status})`);
    });

    // Check today's bookings specifically
    console.log('\n=== TODAY\'S BOOKINGS ===');
    const today = new Date().toISOString().slice(0, 10);
    const todayBookings = await Booking.find({
      bookingDate: {
        $gte: new Date(today + 'T00:00:00.000Z'),
        $lte: new Date(today + 'T23:59:59.999Z')
      }
    }).sort({ createdAt: -1 });
    
    console.log('Today\'s bookings:', todayBookings.length);
    todayBookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.cottageType} #${booking.cottageNumber} at ${booking.bookingTime} (${booking.status})`);
    });

    // Check kubo bookings specifically
    console.log('\n=== KUBO BOOKINGS ===');
    const kuboBookings = await Booking.find({
      cottageType: 'kubo',
      status: { $nin: ['cancelled', 'rejected'] }
    }).sort({ createdAt: -1 });
    
    console.log('Kubo bookings:', kuboBookings.length);
    kuboBookings.forEach((booking, index) => {
      console.log(`${index + 1}. Kubo #${booking.cottageNumber} - ${booking.bookingDate.toISOString().slice(0, 10)} at ${booking.bookingTime} (${booking.status})`);
    });

    // Check cottage data
    console.log('\n=== COTTAGE DATA ===');
    const cottages = await Cottage.find({});
    cottages.forEach(cottage => {
      console.log(`${cottage.name} (${cottage.type}): Quantity ${cottage.quantity}, Available: ${cottage.available}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

debugBookings(); 