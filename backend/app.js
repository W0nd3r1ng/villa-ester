const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const bookingRoutes = require('./routes/bookingRoutes');
const cottageRoutes = require('./routes/cottages');
const recommendationRoutes = require('./routes/recommendations');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: [
      'https://villa-ester-resort.onrender.com',
      'https://villa-ester-frontend.onrender.com',
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow specific origins
    const allowedOrigins = [
      'https://villa-ester-resort.onrender.com',
      'https://villa-ester-frontend.onrender.com',
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Add root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Villa Ester Resort API is running! (Updated with CORS fixes)',
    endpoints: {
      cottages: '/api/cottages',
      bookings: '/api/bookings',
      recommendations: '/api/recommendations',
      reviews: '/api/reviews'
    }
  });
});

// Enhanced MongoDB connection with retry logic
const connectDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10,
      minPoolSize: 2
    };
    
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectDB, 5000);
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Initial connection
connectDB();

// Add debug logging for all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use('/api/bookings', bookingRoutes);
app.use('/api/cottages', cottageRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Password Reset Routes
app.get('/forgot-password', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Forgot Password - Villa Ester Resort</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input[type="email"] { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
            button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            button:hover { background: #0056b3; }
            .error { color: red; margin-top: 10px; }
            .success { color: green; margin-top: 10px; }
        </style>
    </head>
    <body>
        <h2>Forgot Password</h2>
        <p>Enter your email address to receive a password reset code.</p>
        <form action="/forgot-password" method="POST">
            <div class="form-group">
                <label for="email">Email Address:</label>
                <input type="email" id="email" name="email" required>
            </div>
            <button type="submit">Send Reset Code</button>
        </form>
        <p><a href="/">Back to Home</a></p>
    </body>
    </html>
  `);
});

app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Error - Villa Ester Resort</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
                .error { color: red; margin-top: 10px; }
            </style>
        </head>
        <body>
            <h2>Error</h2>
            <p class="error">Email address is required.</p>
            <p><a href="/forgot-password">Try Again</a></p>
        </body>
        </html>
      `);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Store OTP
    otpStorage[email] = {
      otp,
      expires
    };

    // Send email
    const mailOptions = {
      from: `"Villa Ester Resort" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Password Reset OTP',
      text: `Your password reset code is: ${otp}\n\nThis code is valid for 5 minutes.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">Password Reset Request</h2>
          <p>You requested a password reset for your Villa Ester Resort account.</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0; color: #333;">Your Reset Code:</h3>
            <h1 style="margin: 10px 0; color: #007bff; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p><strong>This code is valid for 5 minutes.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Villa Ester Resort - Password Reset Service</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}: ${otp}`);

    // Redirect to OTP verification page
    res.redirect('/verify-otp?email=' + encodeURIComponent(email));
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Error - Villa Ester Resort</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
              .error { color: red; margin-top: 10px; }
          </style>
      </head>
      <body>
          <h2>Error</h2>
          <p class="error">Failed to send reset code. Please try again later.</p>
          <p><a href="/forgot-password">Try Again</a></p>
      </body>
      </html>
    `);
  }
});

app.get('/verify-otp', (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.redirect('/forgot-password');
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Verify OTP - Villa Ester Resort</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input[type="text"] { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 18px; text-align: center; letter-spacing: 3px; }
            button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            button:hover { background: #0056b3; }
            .error { color: red; margin-top: 10px; }
            .info { color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <h2>Verify Reset Code</h2>
        <p class="info">We sent a 6-digit code to: <strong>${email}</strong></p>
        <form action="/verify-otp" method="POST">
            <input type="hidden" name="email" value="${email}">
            <div class="form-group">
                <label for="otp">Enter the 6-digit code:</label>
                <input type="text" id="otp" name="otp" maxlength="6" pattern="[0-9]{6}" required placeholder="000000">
            </div>
            <button type="submit">Verify Code</button>
        </form>
        <p><a href="/forgot-password">Back to Forgot Password</a></p>
    </body>
    </html>
  `);
});

app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Error - Villa Ester Resort</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
              .error { color: red; margin-top: 10px; }
          </style>
      </head>
      <body>
          <h2>Error</h2>
          <p class="error">Email and OTP are required.</p>
          <p><a href="/verify-otp?email=${encodeURIComponent(email || '')}">Try Again</a></p>
      </body>
      </html>
    `);
  }

  const storedData = otpStorage[email];
  
  if (!storedData) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Error - Villa Ester Resort</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
              .error { color: red; margin-top: 10px; }
          </style>
      </head>
      <body>
          <h2>Error</h2>
          <p class="error">No reset code found for this email. Please request a new code.</p>
          <p><a href="/forgot-password">Request New Code</a></p>
      </body>
      </html>
    `);
  }

  if (new Date() > storedData.expires) {
    delete otpStorage[email];
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Error - Villa Ester Resort</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
              .error { color: red; margin-top: 10px; }
          </style>
      </head>
      <body>
          <h2>Error</h2>
          <p class="error">Reset code has expired. Please request a new code.</p>
          <p><a href="/forgot-password">Request New Code</a></p>
      </body>
      </html>
    `);
  }

  if (otp !== storedData.otp) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Error - Villa Ester Resort</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
              .error { color: red; margin-top: 10px; }
          </style>
      </head>
      <body>
          <h2>Error</h2>
          <p class="error">Invalid reset code. Please try again.</p>
          <p><a href="/verify-otp?email=${encodeURIComponent(email)}">Try Again</a></p>
      </body>
      </html>
    `);
  }

  // OTP is valid, show password reset form
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Reset Password - Villa Ester Resort</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input[type="password"] { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
            button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            button:hover { background: #0056b3; }
            .success { color: green; margin-top: 10px; }
        </style>
    </head>
    <body>
        <h2>Reset Password</h2>
        <p class="success">✓ Code verified successfully!</p>
        <form action="/reset-password" method="POST">
            <input type="hidden" name="email" value="${email}">
            <input type="hidden" name="otp" value="${otp}">
            <div class="form-group">
                <label for="newPassword">New Password:</label>
                <input type="password" id="newPassword" name="newPassword" required minlength="6">
            </div>
            <div class="form-group">
                <label for="confirmPassword">Confirm Password:</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6">
            </div>
            <button type="submit">Reset Password</button>
        </form>
    </body>
    </html>
  `);
});

app.post('/reset-password', (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  if (!email || !otp || !newPassword || !confirmPassword) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Error - Villa Ester Resort</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
              .error { color: red; margin-top: 10px; }
          </style>
      </head>
      <body>
          <h2>Error</h2>
          <p class="error">All fields are required.</p>
          <p><a href="/verify-otp?email=${encodeURIComponent(email || '')}">Try Again</a></p>
      </body>
      </html>
    `);
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Error - Villa Ester Resort</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
              .error { color: red; margin-top: 10px; }
          </style>
      </head>
      <body>
          <h2>Error</h2>
          <p class="error">Passwords do not match.</p>
          <p><a href="/verify-otp?email=${encodeURIComponent(email)}">Try Again</a></p>
      </body>
      </html>
    `);
  }

  if (newPassword.length < 6) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Error - Villa Ester Resort</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
              .error { color: red; margin-top: 10px; }
          </style>
      </head>
      <body>
          <h2>Error</h2>
          <p class="error">Password must be at least 6 characters long.</p>
          <p><a href="/verify-otp?email=${encodeURIComponent(email)}">Try Again</a></p>
      </body>
      </html>
    `);
  }

  // Verify OTP again
  const storedData = otpStorage[email];
  if (!storedData || otp !== storedData.otp || new Date() > storedData.expires) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Error - Villa Ester Resort</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
              .error { color: red; margin-top: 10px; }
          </style>
      </head>
      <body>
          <h2>Error</h2>
          <p class="error">Invalid or expired reset code.</p>
          <p><a href="/forgot-password">Request New Code</a></p>
      </body>
      </html>
    `);
  }

  // Mock password update (in real implementation, update user in database)
  console.log(`Password reset requested for ${email}`);
  console.log(`New password would be: ${newPassword}`);
  console.log('In a real implementation, you would:');
  console.log('1. Hash the password using bcrypt');
  console.log('2. Update the user record in the database');
  console.log('3. Invalidate any existing sessions');

  // Delete the OTP
  delete otpStorage[email];

  // Show success page
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Password Reset Success - Villa Ester Resort</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; text-align: center; }
            .success { color: green; margin-top: 10px; font-size: 18px; }
            .checkmark { font-size: 48px; color: green; margin: 20px 0; }
            .info { color: #666; margin: 20px 0; }
            .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; margin: 10px; }
            .btn:hover { background: #0056b3; }
        </style>
    </head>
    <body>
        <div class="checkmark">✓</div>
        <h2>Password Reset Successful!</h2>
        <p class="success">Your password has been reset successfully.</p>
        <p class="info">You can now log in with your new password.</p>
        <a href="/" class="btn">Go to Home</a>
        <a href="/login" class="btn">Login</a>
    </body>
    </html>
  `);
});

// Serve /uploads from either project root or backend/uploads
const uploadsPathRoot = path.join(__dirname, '../uploads');
const uploadsPathLocal = path.join(__dirname, 'uploads');
if (fs.existsSync(uploadsPathRoot)) {
  app.use('/uploads', express.static(uploadsPathRoot));
  console.log('Serving /uploads from', uploadsPathRoot);
} else if (fs.existsSync(uploadsPathLocal)) {
  app.use('/uploads', express.static(uploadsPathLocal));
  console.log('Serving /uploads from', uploadsPathLocal);
} else {
  console.warn('WARNING: uploads directory not found!');
}

// Serve images and favicon statically
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use(express.static(path.join(__dirname, '../'))); // for favicon.ico in root

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Test connection event
  socket.on('test-connection', (data) => {
    console.log('Test connection from client:', data);
    socket.emit('test-response', { 
      message: 'Server received test connection',
      timestamp: new Date(),
      clientId: socket.id
    });
  });
  
  // Join booking room for real-time updates
  socket.on('join-booking-room', (bookingId) => {
    socket.join(`booking-${bookingId}`);
    console.log(`Client ${socket.id} joined booking room: ${bookingId}`);
  });
  
  // Handle booking updates
  socket.on('booking-update', (data) => {
    io.to(`booking-${data.bookingId}`).emit('booking-updated', data);
  });
  
  // Handle new bookings
  socket.on('new-booking', (data) => {
    io.emit('booking-created', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Configure Nodemailer transporter for password reset emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// In-memory OTP storage (in production, use Redis or database)
const otpStorage = {};

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  const now = new Date();
  Object.keys(otpStorage).forEach(email => {
    if (now > otpStorage[email].expires) {
      delete otpStorage[email];
      console.log(`Cleaned up expired OTP for ${email}`);
    }
  });
}, 5 * 60 * 1000); // Run every 5 minutes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Enhanced 404 handler with debug logging
app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all network interfaces

server.listen(PORT, HOST, () => {
  console.log("=== BACKEND STARTED: " + new Date().toISOString());
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://[YOUR_LOCAL_IP]:${PORT}`);
  console.log(`Example: http://192.168.1.100:${PORT}`);
}); 