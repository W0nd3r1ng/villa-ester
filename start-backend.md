# Starting the Backend Server Locally

The backend server at `https://villa-ester-backend.onrender.com` appears to be down or not responding. Here's how to start it locally for development:

## Prerequisites

1. **Node.js** (version 14 or higher)
2. **MongoDB** (local installation or MongoDB Atlas connection)
3. **Environment variables**

## Setup Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Create Environment File
Create a `.env` file in the `backend` directory with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/villa-ester
# OR use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/villa-ester

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=5000
HOST=0.0.0.0

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# OR Production mode
npm start
```

### 4. Test the Server
Once running, you should see:
```
=== BACKEND STARTED: [timestamp]
Server running on http://0.0.0.0:5000
Local access: http://localhost:5000
```

### 5. Update Frontend Configuration
The login form will automatically try the local server as a fallback, but you can also update the login.js to prioritize localhost:

```javascript
const backendUrls = [
    'http://localhost:5000/api/users/login',  // Local development
    'https://villa-ester-backend.onrender.com/api/users/login'  // Production fallback
];
```

## Troubleshooting

### MongoDB Connection Issues
- Make sure MongoDB is running locally
- Or use MongoDB Atlas (cloud) and update the connection string

### Port Already in Use
- Change the PORT in .env file
- Or kill the process using the port: `npx kill-port 5000`

### JWT Secret Issues
- Generate a new JWT secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

## Testing the Login

Once the backend is running locally:

1. Open `login.html` in your browser
2. Try logging in with test credentials
3. Check the browser console for detailed logs
4. The login should now work with the local server

## Production Deployment

For production, you'll need to:
1. Deploy the backend to a hosting service (Render, Heroku, etc.)
2. Update the frontend to use the production URL
3. Set up proper environment variables on the hosting platform 