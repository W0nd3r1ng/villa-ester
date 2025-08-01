const mongoose = require('mongoose');
const User = require('./backend/models/user');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/villa_ester', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');

    // Get all users
    const users = await User.find({}, 'name email role isActive phone createdAt');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      console.log('\n💡 You need to create users first. Run:');
      console.log('   node backend/scripts/createUsers.js');
      console.log('   node create-test-user.js');
    } else {
      console.log(`✅ Found ${users.length} user(s) in database:\n`);
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive ? '✅ Yes' : '❌ No'}`);
        console.log(`   Phone: ${user.phone}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
      
      console.log('📝 Available login credentials:');
      users.forEach(user => {
        if (user.isActive) {
          console.log(`   ${user.email} (${user.role})`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkUsers(); 