const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./backend/models/user');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/villa_ester', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createTestUser() {
  try {
    console.log('Creating test customer user...');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@email.com' });

    if (!existingUser) {
      // Create test customer user
      const testPassword = await bcrypt.hash('test123', 10);
      const testUser = new User({
        name: 'Test Customer',
        email: 'test@email.com',
        password: testPassword,
        role: 'customer',
        phone: '09123456789',
        isActive: true
      });
      await testUser.save();
      console.log('✅ Test customer user created: test@email.com / test123');
    } else {
      console.log('ℹ️ Test user already exists');
    }

    // List all users in the database
    console.log('\n📋 All users in database:');
    const allUsers = await User.find({}, 'name email role isActive');
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
    });

    console.log('\n🎉 Test user setup completed!');
    console.log('\nLogin Credentials for testing:');
    console.log('Customer: test@email.com / test123');
    console.log('Admin: admin@villaester.com / admin123');
    console.log('Clerk: clerk@villaester.com / clerk123');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestUser(); 