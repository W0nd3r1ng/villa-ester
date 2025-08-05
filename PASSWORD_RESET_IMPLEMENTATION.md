# Password Reset Implementation

This document describes the token-based password reset functionality implemented for the Villa Ester Resort application.

## Overview

The password reset system uses secure tokens to allow users to reset their passwords without requiring their current password. The system includes:

1. **Token Generation**: When a user submits their email, a secure 32-byte token is generated
2. **Token Storage**: Tokens are stored in-memory with a 1-hour expiration
3. **Reset Link**: A reset link is created with the token as a query parameter
4. **Password Reset Page**: A dedicated page for users to enter their new password
5. **Token Validation**: Tokens are validated and deleted after use

## Backend Implementation

### Files Modified

1. **`backend/controllers/userController.js`**
   - Added `crypto` import for secure token generation
   - Added in-memory token storage (`passwordResetTokens`)
   - Updated `checkEmail` function to generate tokens and create reset links
   - Updated `resetPassword` function to validate tokens and update passwords

2. **`backend/routes/userRoutes.js`**
   - Added `GET /reset-password` route that serves the reset password HTML page
   - The route validates the token and renders a form for password reset

### Key Features

- **Secure Token Generation**: Uses `crypto.randomBytes(32)` for cryptographically secure tokens
- **Token Expiration**: Tokens expire after 1 hour
- **One-time Use**: Tokens are deleted after successful password reset
- **Email Validation**: Only active users with valid emails can request resets
- **Password Validation**: New passwords must be at least 6 characters long

## Frontend Implementation

### Files Modified

1. **`login.html`**
   - Removed the old password form step from the forgot password modal
   - Updated modal structure to show reset links instead

2. **`login.js`**
   - Updated forgot password flow to display reset links
   - Removed old password form submission handler
   - Added dynamic step management for reset link display

### User Flow

1. User clicks "Forgot Password?" on login page
2. User enters their email address
3. System generates a secure token and creates a reset link
4. Reset link is displayed to the user (in production, this would be sent via email)
5. User clicks the reset link to go to the reset password page
6. User enters new password and confirms it
7. System validates token and updates password
8. User is redirected to login page

## API Endpoints

### POST `/api/users/check-email`
- **Purpose**: Generate password reset token and link
- **Request Body**: `{ "email": "user@example.com" }`
- **Response**: 
  ```json
  {
    "success": true,
    "message": "Password reset link sent to your email",
    "resetLink": "http://localhost:3000/reset-password?token=abc123..."
  }
  ```

### POST `/api/users/reset-password`
- **Purpose**: Reset password using token
- **Request Body**: `{ "token": "abc123...", "password": "newpassword" }`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Password updated successfully"
  }
  ```

### GET `/reset-password?token=abc123...`
- **Purpose**: Serve the password reset form
- **Response**: HTML page with password reset form

## Security Features

1. **Secure Token Generation**: Uses cryptographically secure random bytes
2. **Token Expiration**: Tokens expire after 1 hour
3. **One-time Use**: Tokens are invalidated after use
4. **Email Validation**: Only valid, active user emails can request resets
5. **Password Requirements**: Minimum 6 characters for new passwords
6. **Token Validation**: Comprehensive validation before password updates

## Testing

A test page has been created at `test-password-reset.html` to verify the functionality:

1. **Generate Reset Link**: Test token generation with an email
2. **Test Reset Password**: Test password reset with a token
3. **Test Reset Page**: Open the reset password page directly

## Production Considerations

For production deployment, consider the following improvements:

1. **Email Service Integration**: Replace console logging with actual email sending
2. **Persistent Token Storage**: Use Redis or database for token storage instead of in-memory
3. **Rate Limiting**: Add rate limiting for password reset requests
4. **Email Templates**: Create professional email templates for reset links
5. **HTTPS**: Ensure all reset links use HTTPS
6. **Domain Configuration**: Update reset link domain for production

## Usage Example

```javascript
// Generate reset link
const response = await fetch('/api/users/check-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

// Reset password
const resetResponse = await fetch('/api/users/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    token: 'abc123...', 
    password: 'newpassword123' 
  })
});
```

## Error Handling

The system handles various error scenarios:

- **Invalid Email**: Returns 404 with appropriate message
- **Expired Token**: Returns 400 with expiration message
- **Invalid Token**: Returns 400 with invalid token message
- **Weak Password**: Returns 400 with password requirements
- **Network Errors**: Proper error messages for connectivity issues

## Maintenance

- Tokens are automatically cleaned up after use or expiration
- In-memory storage means tokens are lost on server restart
- Consider implementing a cleanup job for expired tokens in production 