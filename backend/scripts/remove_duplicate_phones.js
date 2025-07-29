const mongoose = require('mongoose');
const User = require('../models/user');

const MONGODB_URI = 'mongodb+srv://villa_ester_admin:Bk5IaRBQjT7Kk2WR@cluster0.tuh5fdh.mongodb.net/villa_ester?retryWrites=true&w=majority&appName=Cluster0';

async function removeDuplicatePhones() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Find all users, sorted by creation date
  const users = await User.find({ phone: { $ne: null } }).sort({ createdAt: 1 });
  const seenPhones = new Set();
  let removedCount = 0;

  for (const user of users) {
    if (user.phone && seenPhones.has(user.phone)) {
      // Duplicate found, remove this user
      await User.deleteOne({ _id: user._id });
      console.log(`Removed duplicate user: ${user.email} (${user.phone})`);
      removedCount++;
    } else if (user.phone) {
      seenPhones.add(user.phone);
    }
  }

  console.log(`Done. Removed ${removedCount} duplicate users.`);
  await mongoose.disconnect();
}

removeDuplicatePhones().catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
}); 