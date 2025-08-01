const https = require('https');

async function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || 443,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };
        
        const req = https.request(requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function testLoginAPI() {
    console.log('Testing login API endpoint...');
    
    const testData = {
        email: 'test@email.com',
        password: 'test123'
    };
    
    try {
        console.log('Making request to: https://villa-ester-backend.onrender.com/api/users/login');
        console.log('Request data:', testData);
        
        const response = await makeRequest('https://villa-ester-backend.onrender.com/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        console.log('Response body:', response.data);
        
        if (response.status >= 200 && response.status < 300) {
            console.log('✅ API is accessible and responding');
        } else {
            console.log('❌ API returned error status');
        }
        
    } catch (error) {
        console.error('❌ Error testing API:', error.message);
        console.error('Full error:', error);
    }
}

// Test basic connectivity first
async function testBasicConnectivity() {
    console.log('Testing basic connectivity...');
    
    try {
        const response = await makeRequest('https://villa-ester-backend.onrender.com/');
        console.log('Root endpoint status:', response.status);
        
        if (response.status >= 200 && response.status < 300) {
            console.log('Root endpoint response:', response.data);
        }
    } catch (error) {
        console.error('❌ Cannot reach server:', error.message);
    }
}

async function runTests() {
    console.log('=== Login API Test ===');
    await testBasicConnectivity();
    console.log('\n---');
    await testLoginAPI();
}

runTests(); 