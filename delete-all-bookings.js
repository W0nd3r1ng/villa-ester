// delete-all-bookings.js
const mongoose = require('mongoose');
const Booking = require('./backend/models/Booking');
const MONGODB_URI = 'mongodb+srv://villa_ester_admin:Bk5IaRBQjT7Kk2WR@cluster0.tuh5fdh.mongodb.net/villa_ester?retryWrites=true&w=majority&appName=Cluster0';

(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    const result = await Booking.deleteMany({});
    console.log('Deleted bookings:', result.deletedCount);
  } catch (err) {
    console.error('Error deleting bookings:', err);
  } finally {
    await mongoose.disconnect();
  }
})();