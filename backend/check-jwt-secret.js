const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('=== JWT SECRET CHECK ===');
console.log('JWT_SECRET from .env:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
console.log('JWT_SECRET first 20 chars:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 20) + '...' : 'Not set');

// Test creating a new token
if (process.env.JWT_SECRET) {
  try {
    const testPayload = { userId: 'test123', role: 'user' };
    const testToken = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Test token created successfully');
    
    // Test verifying the token
    const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
    console.log('Test token verified successfully:', decoded);
  } catch (error) {
    console.error('Error with JWT secret:', error.message);
  }
} else {
  console.error('JWT_SECRET is not set in .env file');
}

console.log('=== END JWT SECRET CHECK ==='); 