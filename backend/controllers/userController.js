const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if user is admin or clerk (only these roles can login to dashboard)
    if (!['admin', 'clerk'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or clerk privileges required.'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password) and token
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// Get current user's profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name email phone');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
};

// Update current user's profile (email/phone)
exports.updateProfile = async (req, res) => {
  try {
    const { email, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (email) user.email = email;
    if (phone) user.phone = phone;
    await user.save();
    res.json({ success: true, message: 'Profile updated', data: { name: user.name, email: user.email, phone: user.phone } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
};

// Change current user's password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
  }
};

// Get all users (for admin/clerk dashboard)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'name email phone role isActive _id');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
}; 

// Admin: Create a new user
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Email, password, and role are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name: name || '',
      email: email.toLowerCase(),
      password: hashed,
      role,
      phone: phone || '',
      isActive: true
    });
    await user.save();
    res.status(201).json({ success: true, message: 'User created', data: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
  }
};

// Admin: Update user email/role/phone
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, phone, name, isActive } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (email) user.email = email;
    if (role) user.role = role;
    if (phone) user.phone = phone;
    if (name) user.name = name;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    await user.save();
    res.json({ success: true, message: 'User updated', data: { id: user._id, email: user.email, role: user.role, phone: user.phone, name: user.name, isActive: user.isActive } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
};

// Admin: Change any user's password
exports.adminChangePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'New password must be at least 4 characters' });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Password changed for user', data: { id: user._id, email: user.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
  }
};

// Admin: Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Prevent deletion of the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot delete the last admin user' });
      }
    }
    
    await User.findByIdAndDelete(id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
}; 