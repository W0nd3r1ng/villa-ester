const mongoose = require('mongoose');
const Cottage = require('./models/cottage');
const Booking = require('./models/Booking');
require('dotenv').config();

async function testAvailability() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Test 1: Check cottage data
    console.log('\n=== TEST 1: Checking cottage data ===');
    const cottages = await Cottage.find({});
    console.log('Total cottages found:', cottages.length);
    cottages.forEach(cottage => {
      console.log(`- ${cottage.name} (${cottage.type}): Quantity ${cottage.quantity}, Available: ${cottage.available}`);
    });

    // Test 2: Check existing bookings for today
    console.log('\n=== TEST 2: Checking existing bookings ===');
    const today = new Date().toISOString().slice(0, 10);
    const bookings = await Booking.find({
      bookingDate: {
        $gte: new Date(today + 'T00:00:00.000Z'),
        $lte: new Date(today + 'T23:59:59.999Z')
      },
      status: { $nin: ['cancelled', 'rejected'] }
    });
    console.log('Bookings for today:', bookings.length);
    bookings.forEach(booking => {
      console.log(`- ${booking.cottageType} #${booking.cottageNumber} at ${booking.bookingTime} (${booking.status})`);
    });

    // Test 3: Test availability for kubo type
    console.log('\n=== TEST 3: Testing kubo availability ===');
    const kuboCottage = await Cottage.findOne({ type: 'kubo' });
    if (kuboCottage) {
      console.log('Kubo cottage found:', kuboCottage.name, 'Quantity:', kuboCottage.quantity);
      
      const kuboBookings = await Booking.find({
        cottageType: 'kubo',
        bookingDate: {
          $gte: new Date(today + 'T00:00:00.000Z'),
          $lte: new Date(today + 'T23:59:59.999Z')
        },
        bookingTime: '08:00',
        status: { $nin: ['cancelled', 'rejected'] }
      });
      
      console.log('Kubo bookings for today at 08:00:', kuboBookings.length);
      const assignedNumbers = kuboBookings.map(b => b.cottageNumber).filter(n => typeof n === 'number');
      console.log('Assigned cottage numbers:', assignedNumbers);
      
      const availableNumbers = [];
      for (let i = 1; i <= kuboCottage.quantity; i++) {
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

testAvailability(); 