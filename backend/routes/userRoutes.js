const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword, getAllUsers, login, createUser, updateUser, adminChangePassword, deleteUser } = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

// Login route (public - no authentication required)
router.post('/login', login);

// Get current user's profile
router.get('/me', auth, getProfile);
// Update current user's profile (phone/email)
router.put('/me', auth, updateProfile);
// Change current user's password
router.put('/me/password', auth, changePassword);

// Get all users (customers)
router.get('/', getAllUsers);

// Admin-only user management
router.post('/', auth, admin, createUser);
router.put('/:id', auth, admin, updateUser);
router.put('/:id/password', auth, admin, adminChangePassword);
router.delete('/:id', auth, admin, deleteUser);

module.exports = router; 