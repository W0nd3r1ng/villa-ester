const axios = require('axios');

async function testAvailableNumbers() {
  try {
    console.log('Testing cottage-numbers endpoint...');
    
    const response = await axios.get('http://localhost:5000/api/bookings/get-cottage-numbers', {
      params: {
        cottageType: 'kubo',
        bookingDate: '2025-07-29',
        bookingTime: '08:00'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    console.error('Status:', error.response ? error.response.status : 'No response');
  }
}

testAvailableNumbers(); 