const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

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
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// CORS configuration
app.use(cors({
  origin: '*', // Allow all origins for development
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
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      bufferMaxEntries: 0,
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