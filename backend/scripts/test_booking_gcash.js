require('dotenv').config({ path: '../.env' });

const mongoose = require('mongoose');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// CONFIGURE THESE:
const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';
const MONGODB_URI = 'mongodb+srv://villa_ester_admin:Bk5IaRBQjT7Kk2WR@cluster0.tuh5fdh.mongodb.net/villa_ester?retryWrites=true&w=majority&appName=Cluster0';
const TEST_PHONE = '09999999999';
const TEST_EMAIL = 'gcash_test@example.com';
const TEST_GCASH_REF = 'GCASH-TEST-REF-123456';
const TEST_NAME = 'GCash Test User';
const TEST_COTTAGE_TYPE = 'kubo';
const TEST_PROOF_PATH = null; // Set to a valid image path if you want to test file upload

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODdjYmFlYTk0MjVlZDBjOTFlNWE5YjYiLCJyb2xlIjoiY3VzdG9tZXIiLCJlbWFpbCI6InRlc3RAZW1haWwuY29tIiwiaWF0IjoxNzUzMDY1ODU5LCJleHAiOjE3NTM2NzA2NTl9._ZNZ-uOi9AZ1nvNINVB4q4AS_BxKNCv8ZLk55vjJcYk';

async function testBookingGcash() {
  // 1. Connect to MongoDB
  await mongoose.connect(MONGODB_URI);
  const Booking = require('../models/Booking');
  // 2. Remove any previous test bookings
  await Booking.deleteMany({ contactPhone: TEST_PHONE });
  console.log('Removed previous test bookings.');

  // 3. Prepare FormData
  const form = new FormData();
  form.append('bookingDate', '2025-12-31');
  form.append('bookingTime', '08:00');
  form.append('duration', '600');
  form.append('numberOfPeople', '5');
  form.append('specialRequests', '');
  form.append('contactPhone', TEST_PHONE);
  form.append('contactEmail', TEST_EMAIL);
  form.append('notes', 'Booking Type: daytour; Adults: 5; Children: 0');
  form.append('fullName', TEST_NAME);
  form.append('cottageType', TEST_COTTAGE_TYPE);
  form.append('gcashReference', TEST_GCASH_REF);
  if (TEST_PROOF_PATH && fs.existsSync(TEST_PROOF_PATH)) {
    form.append('proofOfPayment', fs.createReadStream(TEST_PROOF_PATH));
  }

  // 4. Submit booking
  try {
    const res = await axios.post(`${API_BASE}/bookings`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${TOKEN}` },
      validateStatus: () => true
    });
    console.log('Booking creation response:', res.data);
    if (!res.data.data || !res.data.data._id) {
      console.error('Booking creation failed.');
      return;
    }
    const bookingId = res.data.data._id;
    // 5. Fetch booking from DB
    const booking = await Booking.findById(bookingId);
    console.log('Booking in DB:', booking);
    // 6. Check gcashReference
    if (booking && booking.gcashReference === TEST_GCASH_REF) {
      console.log('✅ GCash reference saved correctly!');
    } else {
      console.error('❌ GCash reference NOT saved correctly!');
    }
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testBookingGcash(); 