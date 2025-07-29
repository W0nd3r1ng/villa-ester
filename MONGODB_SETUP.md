# MongoDB Atlas Setup Guide - Villa Ester Resort

## Step 1: Create MongoDB Atlas Account

### 1.1 Go to MongoDB Atlas
- Open your browser and go to: https://www.mongodb.com/atlas
- Click **"Try Free"** or **"Get Started Free"**

### 1.2 Sign Up
- Choose **"Sign up with email"**
- Enter your email address
- Create a password
- Click **"Create account"**

### 1.3 Verify Email
- Check your email for verification link
- Click the verification link to activate your account

## Step 2: Create Your First Cluster

### 2.1 Choose Plan
- Select **"FREE"** plan (M0 Sandbox)
- Click **"Create"**

### 2.2 Choose Cloud Provider & Region
- **Cloud Provider**: Choose any (AWS, Google Cloud, or Azure)
- **Region**: Choose closest to your location (e.g., US East for North America)
- Click **"Next"**

### 2.3 Cluster Settings
- **Cluster Name**: Leave as default or name it `villa-ester-cluster`
- Click **"Create Cluster"**

**Note**: It takes 2-3 minutes to create the cluster.

## Step 3: Set Up Database Access

### 3.1 Create Database User
- In the left sidebar, click **"Database Access"**
- Click **"Add New Database User"**

### 3.2 Configure User
- **Authentication Method**: Select **"Password"**
- **Username**: Enter `villa_ester_user`
- **Password**: Click **"Autogenerate Secure Password"** (save this password!)
- **Database User Privileges**: Select **"Read and write to any database"**
- Click **"Add User"**

### 3.3 Save Credentials
**IMPORTANT**: Save these credentials in a secure place:
- Username: `villa_ester_user`
- Password: [The generated password]

## Step 4: Set Up Network Access

### 4.1 Go to Network Access
- In the left sidebar, click **"Network Access"**
- Click **"Add IP Address"**

### 4.2 Allow All IPs (for development)
- Click **"Allow Access from Anywhere"** (this adds `0.0.0.0/0`)
- Click **"Confirm"**

**Note**: This allows connections from anywhere. For production, you should restrict to specific IPs.

## Step 5: Get Your Connection String

### 5.1 Go to Database
- In the left sidebar, click **"Database"**
- Click **"Connect"** on your cluster

### 5.2 Choose Connection Method
- Select **"Connect your application"**
- Click **"Next"**

### 5.3 Get Connection String
- **Driver**: Node.js
- **Version**: 5.0 or later
- Copy the connection string

### 5.4 Format Your Connection String
Your connection string will look like this:
```
mongodb+srv://villa_ester_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**Replace the placeholders:**
- `YOUR_PASSWORD`: The password you generated in Step 3
- Add database name: Add `/villa_ester` before the `?`

**Final connection string should look like:**
```
mongodb+srv://villa_ester_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/villa_ester?retryWrites=true&w=majority
```

## Step 6: Test Your Connection

### 6.1 Create Environment File
1. In your project, copy the environment template:
```bash
cp backend/env.example backend/.env
```

### 6.2 Update Environment Variables
Edit `backend/.env` and update:
```env
MONGODB_URI=mongodb+srv://villa_ester_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/villa_ester?retryWrites=true&w=majority
MONGODB_URI_PROD=mongodb+srv://villa_ester_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/villa_ester?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
```

### 6.3 Test Connection Locally
```bash
cd backend
npm install
npm start
```

If you see "Connected to MongoDB" in the console, you're good to go!

## Step 7: Create Initial Collections (Optional)

### 7.1 Go to Collections
- In your cluster, click **"Browse Collections"**
- Click **"Create Database"**

### 7.2 Create Database
- **Database Name**: `villa_ester`
- **Collection Name**: `users`
- Click **"Create"**

### 7.3 Create Additional Collections
Create these collections in the `villa_ester` database:
- `rooms`
- `bookings`
- `recommendations`

## Step 8: Security Best Practices

### 8.1 Environment Variables
- Never commit `.env` files to Git
- Use different passwords for development and production
- Rotate passwords regularly

### 8.2 Network Security
- For production, restrict IP addresses to your server IPs
- Use VPC peering if possible

### 8.3 Database User Permissions
- Use least privilege principle
- Create separate users for different applications

## Troubleshooting

### Connection Issues
- **"Authentication failed"**: Check username/password
- **"Network timeout"**: Check if IP is whitelisted
- **"Invalid connection string"**: Verify the format

### Common Errors
- **ECONNREFUSED**: Check if MongoDB Atlas is accessible
- **MongoServerSelectionError**: Check network access settings
- **MongoParseError**: Check connection string format

### Useful Commands
```bash
# Test connection string format
node -e "console.log('Connection string format is correct')"

# Check if .env file exists
ls -la backend/.env

# Test MongoDB connection
cd backend && node -e "require('dotenv').config(); console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set')"
```

## Next Steps

After completing MongoDB Atlas setup:
1. ✅ Test local connection
2. 🔄 Deploy to Render (see DEPLOYMENT.md)
3. 🔄 Set environment variables in Render dashboard
4. 🔄 Test production connection

## Support

- **MongoDB Atlas Documentation**: https://docs.atlas.mongodb.com/
- **MongoDB Community**: https://community.mongodb.com/
- **Connection String Help**: https://docs.mongodb.com/manual/reference/connection-string/ 