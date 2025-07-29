const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/villa_ester', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createUsers() {
  try {
    console.log('Creating admin and clerk users...');

    // Check if users already exist
    const existingAdmin = await User.findOne({ email: 'admin@villaester.com' });
    const existingClerk = await User.findOne({ email: 'clerk@villaester.com' });

    if (!existingAdmin) {
      // Create admin user
      const adminPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        name: 'Admin User',
        email: 'admin@villaester.com',
        password: adminPassword,
        role: 'admin',
        phone: '+639123456789',
        isActive: true
      });
      await admin.save();
      console.log('✅ Admin user created: admin@villaester.com / admin123');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    if (!existingClerk) {
      // Create clerk user
      const clerkPassword = await bcrypt.hash('clerk123', 10);
      const clerk = new User({
        name: 'Clerk User',
        email: 'clerk@villaester.com',
        password: clerkPassword,
        role: 'clerk',
        phone: '+639987654321',
        isActive: true
      });
      await clerk.save();
      console.log('✅ Clerk user created: clerk@villaester.com / clerk123');
    } else {
      console.log('ℹ️ Clerk user already exists');
    }

    console.log('🎉 User creation completed!');
    console.log('\nLogin Credentials:');
    console.log('Admin: admin@villaester.com / admin123');
    console.log('Clerk: clerk@villaester.com / clerk123');

  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    mongoose.connection.close();
  }
}

createUsers(); 