# Deployment Guide - Villa Ester Resort

## 1. GitHub Setup

### Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit: Villa Ester Resort project"
```

### Create GitHub Repository
1. Go to [GitHub.com](https://github.com)
2. Click "New repository"
3. Name: `villa-ester-resort`
4. Make it public
5. Don't initialize with README (we already have one)
6. Copy the repository URL

### Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/villa-ester-resort.git
git branch -M main
git push -u origin main
```

## 2. MongoDB Atlas Setup

### Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free account
3. Create new cluster (free tier)
4. Choose cloud provider & region

### Configure Database
1. Create database user (remember username/password)
2. Add IP address: `0.0.0.0/0` (allow all IPs)
3. Get connection string

### Update Environment Variables
1. Copy `backend/env.example` to `backend/.env`
2. Replace `MONGODB_URI_PROD` with your Atlas connection string
3. Generate a random `JWT_SECRET`

## 3. Render Deployment

### Deploy Backend
1. Go to [Render.com](https://render.com)
2. Connect your GitHub account
3. Click "New Web Service"
4. Select your repository
5. Configure:
   - Name: `villa-ester-backend`
   - Environment: Node
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Plan: Free

### Set Environment Variables in Render
Add these environment variables in Render dashboard:
- `NODE_ENV`: `production`
- `PORT`: `3000`
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: Your secret key
- `CORS_ORIGIN`: Your frontend URL (will be set after frontend deployment)

### Deploy Frontend
1. In Render, click "New Static Site"
2. Select your repository
3. Configure:
   - Name: `villa-ester-frontend`
   - Build Command: `echo "Static site"`
   - Publish Directory: `.` (root)
   - Plan: Free

### Update CORS Origin
After frontend deploys, update the `CORS_ORIGIN` in backend environment variables to your frontend URL.

## 4. Final Steps

### Test Your Application
1. Backend URL: `https://villa-ester-backend.onrender.com`
2. Frontend URL: `https://villa-ester-frontend.onrender.com`

### Update Frontend API Calls
Update all API calls in your frontend JavaScript files to use the backend URL instead of localhost.

### Monitor and Debug
- Check Render logs for any deployment issues
- Monitor MongoDB Atlas for database connections
- Test all features on the live site

## 5. Troubleshooting

### Common Issues
- **CORS errors**: Make sure CORS_ORIGIN is set correctly
- **Database connection**: Verify MongoDB Atlas connection string
- **Build failures**: Check if all dependencies are in package.json
- **Environment variables**: Ensure all required variables are set in Render

### Useful Commands
```bash
# Check if backend is running locally
cd backend && npm start

# Test database connection
cd backend && node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI)"

# Check git status
git status
git log --oneline
``` 