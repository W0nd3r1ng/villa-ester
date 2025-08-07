const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword, getAllUsers, login, createUser, updateUser, adminChangePassword, deleteUser, checkEmail, resetPassword } = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

// Login route (public - no authentication required)
router.post('/login', login);

// Public registration route - removed since we simplified the system
// router.post('/register', require('../controllers/userController').register);

// Forgot password routes (public - no authentication required)
router.post('/check-email', checkEmail);
router.post('/reset-password', resetPassword);

// Reset password page routes (public - no authentication required)
router.get('/reset-password', (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invalid Reset Link</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #d32f2f; }
        </style>
      </head>
      <body>
        <h1 class="error">Invalid Reset Link</h1>
        <p>This password reset link is invalid or missing the required token.</p>
        <p><a href="/login.html">Return to Login</a></p>
      </body>
      </html>
    `);
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reset Password | Villa Ester Resort</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          max-width: 400px;
          width: 100%;
        }
        .logo {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
        }
        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 10px;
        }
        .subtitle {
          text-align: center;
          color: #666;
          margin-bottom: 30px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          color: #333;
          font-weight: bold;
        }
        .form-group input {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 5px;
          font-size: 16px;
          box-sizing: border-box;
        }
        .form-group input:focus {
          outline: none;
          border-color: #667eea;
        }
        .submit-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .submit-btn:hover {
          transform: translateY(-2px);
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .error {
          color: #d32f2f;
          text-align: center;
          margin-top: 10px;
          display: none;
        }
        .success {
          color: #388e3c;
          text-align: center;
          margin-top: 10px;
          display: none;
        }
        .back-link {
          text-align: center;
          margin-top: 20px;
        }
        .back-link a {
          color: #667eea;
          text-decoration: none;
        }
        .back-link a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <img src="/images/logo.jpg" alt="Villa Ester Resort Logo">
        </div>
        <h1>Reset Password</h1>
        <p class="subtitle">Enter your new password below</p>
        
        <form id="reset-form">
          <input type="hidden" id="token" value="${token}">
          
          <div class="form-group">
            <label for="password">New Password</label>
            <input type="password" id="password" name="password" required minlength="6" placeholder="Enter new password">
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6" placeholder="Confirm new password">
          </div>
          
          <button type="submit" class="submit-btn" id="submit-btn">Reset Password</button>
        </form>
        
        <div id="error-message" class="error"></div>
        <div id="success-message" class="success"></div>
        
        <div class="back-link">
          <a href="/login.html">Back to Login</a>
        </div>
      </div>

      <script>
        document.getElementById('reset-form').addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const token = document.getElementById('token').value;
          const password = document.getElementById('password').value;
          const confirmPassword = document.getElementById('confirmPassword').value;
          const submitBtn = document.getElementById('submit-btn');
          const errorDiv = document.getElementById('error-message');
          const successDiv = document.getElementById('success-message');
          
          // Clear previous messages
          errorDiv.style.display = 'none';
          successDiv.style.display = 'none';
          
          // Validation
          if (password.length < 6) {
            showError('Password must be at least 6 characters long');
            return;
          }
          
          if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
          }
          
          // Show loading state
          submitBtn.disabled = true;
          submitBtn.textContent = 'Resetting Password...';
          
          try {
            const response = await fetch('/api/users/reset-password', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token: token,
                password: password
              })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
              showSuccess('Password reset successfully! Redirecting to login...');
              setTimeout(() => {
                window.location.href = '/login.html';
              }, 2000);
            } else {
              showError(data.message || 'Failed to reset password');
            }
          } catch (error) {
            console.error('Reset password error:', error);
            showError('Network error. Please try again.');
          } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset Password';
          }
        });
        
        function showError(message) {
          const errorDiv = document.getElementById('error-message');
          errorDiv.textContent = message;
          errorDiv.style.display = 'block';
        }
        
        function showSuccess(message) {
          const successDiv = document.getElementById('success-message');
          successDiv.textContent = message;
          successDiv.style.display = 'block';
        }
      </script>
    </body>
    </html>
  `);
});

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