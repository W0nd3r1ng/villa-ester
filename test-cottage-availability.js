const axios = require('axios');
const { getLocalIPAddress } = require('./get-network-info.js');

// Test configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_COTTAGE_TYPE = 'kubo'; // Change this to test different cottage types

async function testCottageAvailability() {
  console.log('=== TESTING COTTAGE AVAILABILITY ===');
  console.log('Base URL:', BASE_URL);
  console.log('Cottage Type:', TEST_COTTAGE_TYPE);
  
  // Show network info if testing locally
  if (BASE_URL.includes('localhost')) {
    console.log('\n📡 Network Access Information:');
    const localIPs = getLocalIPAddress();
    if (localIPs.length > 0) {
      const mainIP = localIPs[0].address;
      const port = process.env.PORT || 5000;
      console.log(`   Network URL: http://${mainIP}:${port}`);
      console.log(`   Test from phone: http://${mainIP}:${port}`);
    }
  }
  
  try {
    // Test 1: Check availability for today
    const today = new Date().toISOString().split('T')[0];
    console.log('\n--- Test 1: Today\'s availability ---');
    console.log('Date:', today);
    
    const response1 = await axios.get(`${BASE_URL}/api/bookings/get-cottage-numbers`, {
      params: {
        cottageType: TEST_COTTAGE_TYPE,
        bookingDate: today,
        bookingTime: 'day'
      },
      timeout: 15000
    });
    
    console.log('✅ Response:', JSON.stringify(response1.data, null, 2));
    
    // Test 2: Check availability for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    console.log('\n--- Test 2: Tomorrow\'s availability ---');
    console.log('Date:', tomorrowStr);
    
    const response2 = await axios.get(`${BASE_URL}/api/bookings/get-cottage-numbers`, {
      params: {
        cottageType: TEST_COTTAGE_TYPE,
        bookingDate: tomorrowStr,
        bookingTime: 'day'
      },
      timeout: 15000
    });
    
    console.log('✅ Response:', JSON.stringify(response2.data, null, 2));
    
    // Test 3: Check availability for next week
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    
    console.log('\n--- Test 3: Next week\'s availability ---');
    console.log('Date:', nextWeekStr);
    
    const response3 = await axios.get(`${BASE_URL}/api/bookings/get-cottage-numbers`, {
      params: {
        cottageType: TEST_COTTAGE_TYPE,
        bookingDate: nextWeekStr,
        bookingTime: 'day'
      },
      timeout: 15000
    });
    
    console.log('✅ Response:', JSON.stringify(response3.data, null, 2));
    
    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY');
    
    // Show network testing instructions
    if (BASE_URL.includes('localhost')) {
      console.log('\n📱 To test from your phone:');
      const localIPs = getLocalIPAddress();
      if (localIPs.length > 0) {
        const mainIP = localIPs[0].address;
        const port = process.env.PORT || 5000;
        console.log(`   1. Open browser on your phone`);
        console.log(`   2. Go to: http://${mainIP}:${port}`);
        console.log(`   3. Test the cottage availability functionality`);
        console.log(`   4. Check if cottage numbers load properly`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Provide troubleshooting tips
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the server is running: npm start');
    console.log('   2. Check if the port is correct');
    console.log('   3. Verify MongoDB connection');
    console.log('   4. Check server logs for errors');
    
    process.exit(1);
  }
}

// Run the test
testCottageAvailability(); 