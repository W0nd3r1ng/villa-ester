const Booking = require('../models/Booking');
const User = require('../models/user');
const Review = require('../models/Review');
const Cottage = require('../models/cottage');

// Get all bookings (with optional filters)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email phone')
      .populate('serviceId', 'name price duration');
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings', error: err.message });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('serviceId', 'name price duration');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch booking', error: err.message });
  }
};

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const users = await User.find({}, 'name email phone');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch customers', error: err.message });
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, 'name email phone');
    if (!user) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch customer', error: err.message });
  }
};

// Get all reviews (optionally with booking info)
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ date: -1 }).limit(50);
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: err.message });
  }
};

// Get real-time room/cottage occupancy status
exports.getRoomOccupancy = async (req, res) => {
  try {
    const cottages = await Cottage.find();
    const today = new Date();
    const bookings = await Booking.find({
      status: { $nin: ['cancelled', 'rejected'] },
      $or: [
        { bookingDate: { $lte: today }, checkoutDate: { $gte: today } },
        { checkinDate: { $lte: today }, checkoutDate: { $gte: today } }
      ]
    });
    const occupiedCottageIds = new Set(bookings.map(b => b.cottageId || b.cottage || b.cottageName));
    const status = cottages.map(cottage => ({
      name: cottage.name,
      id: cottage._id,
      occupied: occupiedCottageIds.has(cottage._id) || occupiedCottageIds.has(cottage.name)
    }));
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch room occupancy', error: err.message });
  }
};

// Generate monthly report (bookings, revenue, etc.)
exports.getMonthlyReport = async (req, res) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const bookings = await Booking.find({
      bookingDate: { $gte: firstDay, $lte: lastDay },
      status: { $nin: ['cancelled', 'rejected'] }
    });
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
    res.json({
      success: true,
      data: {
        month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
        totalBookings: bookings.length,
        totalRevenue,
        bookings
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate report', error: err.message });
  }
}; 