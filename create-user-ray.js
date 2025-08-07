const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./backend/models/user');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/villa_ester', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createRayUser() {
  try {
    console.log('Creating Ray user...');

    // Check if user already exists
    const existingRay = await User.findOne({ email: 'ray@email.com' });
    if (existingRay) {
      console.log('✅ User ray@email.com already exists');
      console.log('Email: ray@email.com');
      console.log('Password: ray123');
      return;
    }

    // Create Ray user
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

  } catch (error) {
    console.error('Error creating Ray user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createRayUser();
