const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Simple OTP storage (in production, use Redis or database)
const otpStorage = new Map();

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

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

    // Find user by email (case insensitive)
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

// Public user registration
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }
    
    // Check for existing user with same email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }
    
    // Check for existing user with same phone
    const existingPhone = await User.findOne({ phone: phone });
    if (existingPhone) {
      return res.status(409).json({ 
        success: false, 
        message: 'Phone number already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: 'customer',
      isActive: true
    });
    
    await user.save();
    
    // Emit real-time event for new user registration
    const io = req.app && req.app.get && req.app.get('io');
    if (io) {
      io.emit('user-created', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive
        },
        message: 'New user registered',
        timestamp: new Date()
      });
      console.log('Emitted user-created event for:', user.email, user.phone);
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Registration successful', 
      data: { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        phone: user.phone 
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to register', 
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
    
    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email is already taken' });
      }
      user.email = email.toLowerCase();
    }
    
    if (phone) {
      user.phone = phone;
    }
    
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: {
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
};

// Change current user's password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
};

// Create new user (admin only)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      role: role || 'customer',
      isActive: true
    });
    
    await user.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
  }
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, isActive } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'User updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
};

// Admin change user password (admin only)
exports.adminChangePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    await User.findByIdAndDelete(id);
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
};

// Demo forgot password system - any OTP works
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Email not found. Please check your email address.' 
      });
    }
    
    // Generate random 6-digit OTP for show
    const fakeOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store email for password reset (any OTP will work)
    const expirationTime = Date.now() + (10 * 60 * 1000); // 10 minutes
    otpStorage.set(email.toLowerCase(), {
      email: email.toLowerCase(),
      expirationTime,
      attempts: 0
    });
    
    // Email content (for show)
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@villaester.com',
      to: email,
      subject: 'Password Reset OTP - Villa Ester Resort',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #667eea; margin: 0; font-size: 24px;">Villa Ester Resort</h1>
              <p style="color: #666; margin: 5px 0;">Password Reset Request</p>
            </div>
            
            <p style="color: #333; font-size: 16px;">Hello ${user.name},</p>
            <p style="color: #333; font-size: 16px;">You have requested to reset your password. Use the following OTP to complete the process:</p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; text-align: center; margin: 25px 0; border-radius: 8px;">
              <h1 style="color: white; font-size: 36px; margin: 0; letter-spacing: 3px; font-weight: bold;">${fakeOtp}</h1>
            </div>
            
            <p style="color: #d32f2f; font-size: 14px; font-weight: bold;">⚠️ This OTP will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this password reset, please ignore this email.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #999; font-size: 12px;">Best regards,<br>Villa Ester Resort Team</p>
            </div>
          </div>
        </div>
      `
    };
    
    // Try to send email (for show)
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Demo OTP email sent to ${email}: ${fakeOtp}`);
      
      res.json({ 
        success: true, 
        message: 'OTP sent to your email address'
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // If email fails, still return success (demo mode)
      res.json({ 
        success: true, 
        message: 'OTP sent to your email address',
        demoOtp: fakeOtp, // For testing - shows the "sent" OTP
        note: 'Email configuration not set up. This is a demo system.'
      });
    }
    
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP. Please try again.',
      error: error.message
    });
  }
};

// Demo reset password - any OTP works
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, OTP, and new password are required' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }
    
    // Check if email exists in storage (any OTP will work)
    const otpData = otpStorage.get(email.toLowerCase());
    if (!otpData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP. Please request a new one.' 
      });
    }
    
    // Check if OTP is expired
    if (Date.now() > otpData.expirationTime) {
      otpStorage.delete(email.toLowerCase());
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired. Please request a new one.' 
      });
    }
    
    // Demo mode: Any 6-digit OTP works
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid 6-digit OTP' 
      });
    }
    
    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user's password
    user.password = hashedPassword;
    await user.save();
    
    // Delete the OTP data after successful use
    otpStorage.delete(email.toLowerCase());
    
    // Log the password reset for security
    console.log(`Demo password reset for user: ${user.email} at ${new Date().toISOString()}`);
    
    res.json({ 
      success: true, 
      message: 'Password updated successfully' 
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update password. Please try again.' 
    });
  }
}; 