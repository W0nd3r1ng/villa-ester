const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./backend/models/user');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/villa_ester', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createTestUsers() {
  try {
    console.log('Creating test users...');

    // Test user 1: ray@email.com
    const existingRay = await User.findOne({ email: 'ray@email.com' });
    if (!existingRay) {
      const rayPassword = await bcrypt.hash('ray123', 10);
      const ray = new User({
        name: 'Ray Test User',
        email: 'ray@email.com',
        password: rayPassword,
        phone: '+639123456789',
        role: 'customer',
        isActive: true
      });
      await ray.save();
      console.log('✅ Created user: ray@email.com / ray123');
    } else {
      console.log('ℹ️ User ray@email.com already exists');
    }

    // Test user 2: admin@villaester.com
    const existingAdmin = await User.findOne({ email: 'admin@villaester.com' });
    if (!existingAdmin) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        name: 'Admin User',
        email: 'admin@villaester.com',
        password: adminPassword,
        phone: '+639123456789',
        role: 'admin',
        isActive: true
      });
      await admin.save();
      console.log('✅ Created admin: admin@villaester.com / admin123');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Test user 3: clerk@villaester.com
    const existingClerk = await User.findOne({ email: 'clerk@villaester.com' });
    if (!existingClerk) {
      const clerkPassword = await bcrypt.hash('clerk123', 10);
      const clerk = new User({
        name: 'Clerk User',
        email: 'clerk@villaester.com',
        password: clerkPassword,
        phone: '+639987654321',
        role: 'clerk',
        isActive: true
      });
      await clerk.save();
      console.log('✅ Created clerk: clerk@villaester.com / clerk123');
    } else {
      console.log('ℹ️ Clerk user already exists');
    }

    console.log('\n🎉 Test users created successfully!');
    console.log('\nLogin Credentials:');
    console.log('Customer: ray@email.com / ray123');
    console.log('Admin: admin@villaester.com / admin123');
    console.log('Clerk: clerk@villaester.com / clerk123');

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestUsers();
