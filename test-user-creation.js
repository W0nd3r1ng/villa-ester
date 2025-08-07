const bcrypt = require('bcryptjs');
const User = require('./backend/models/user');

async function createTestUser() {
    try {
        // Check if test user already exists
        const existingUser = await User.findOne({ email: 'test@test.com' });
        
        if (existingUser) {
            console.log('Test user already exists');
            return;
        }
        
        // Create test user
        const hashedPassword = await bcrypt.hash('test123', 10);
        
        const testUser = new User({
            name: 'Test User',
            email: 'test@test.com',
            password: hashedPassword,
            phone: '1234567890',
            role: 'customer',
            isActive: true
        });
        
        await testUser.save();
        console.log('Test user created successfully');
        console.log('Email: test@test.com');
        console.log('Password: test123');
        
    } catch (error) {
        console.error('Error creating test user:', error);
    }
}

createTestUser();
