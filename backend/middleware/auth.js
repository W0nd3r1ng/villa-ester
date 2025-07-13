const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Authentication middleware to verify JWT token
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

/**
 * Authentication middleware that allows access to own resources
 */
const authOwnResource = (resourceUserIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      // First authenticate the user
      await auth(req, res, async () => {
        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
        
        // Allow access if user is admin or owns the resource
        if (req.user.role === 'admin' || req.user._id.toString() === resourceUserId) {
          next();
        } else {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You can only access your own resources.'
          });
        }
      });
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { auth, optionalAuth, authOwnResource }; 