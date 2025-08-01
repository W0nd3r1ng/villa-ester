const axios = require('axios');

async function testAPIHealth() {
    console.log('=== TESTING API HEALTH ===');
    
    try {
        // Test the root endpoint
        console.log('Testing root endpoint...');
        const rootResponse = await axios.get('https://villa-ester-backend.onrender.com/', {
            timeout: 10000
        });
        console.log('✅ Root endpoint working:', rootResponse.status);
        console.log('Response:', rootResponse.data);
        
        // Test if the users endpoint exists
        console.log('\nTesting users endpoint...');
        const usersResponse = await axios.get('https://villa-ester-backend.onrender.com/api/users', {
            timeout: 10000
        });
        console.log('✅ Users endpoint working:', usersResponse.status);
        
    } catch (error) {
        console.error('❌ API Health Check Failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testAPIHealth(); 