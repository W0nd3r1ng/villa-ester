const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Cottage = require('./models/cottage');
require('dotenv').config();

async function testAvailability() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test date and time
    const testDate = '2025-07-14';
    const testTime = '08:00';

    console.log('\n=== Testing Availability System ===');
    console.log('Test Date:', testDate);
    console.log('Test Time:', testTime);

    // Check each cottage type
    const cottageTypes = ['kubo', 'With Videoke', 'Without Videoke', 'garden'];
    
    for (const cottageType of cottageTypes) {
      console.log(`\n--- Testing ${cottageType} ---`);
      
      // Get cottage info
      const cottage = await Cottage.findOne({ type: cottageType });
      if (cottage) {
        console.log(`Total quantity: ${cottage.quantity}`);
      }

      // Check availability
      const isAvailable = await Booking.checkAvailabilityByType(cottageType, testDate, testTime);
      const availableQuantity = await Booking.getAvailableQuantity(cottageType, testDate, testTime);
      
      console.log(`Available: ${isAvailable}`);
      console.log(`Available quantity: ${availableQuantity}`);
    }

    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('❌ Error testing availability:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testAvailability(); 