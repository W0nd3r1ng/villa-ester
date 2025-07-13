# MongoDB Atlas Setup Checklist

## ✅ Step-by-Step Checklist

### Account Setup
- [ ] Go to https://www.mongodb.com/atlas
- [ ] Click "Try Free"
- [ ] Sign up with email
- [ ] Verify email address

### Cluster Creation
- [ ] Select FREE plan (M0 Sandbox)
- [ ] Choose cloud provider (AWS/Google Cloud/Azure)
- [ ] Select region (closest to you)
- [ ] Name cluster (optional)
- [ ] Click "Create Cluster"
- [ ] Wait 2-3 minutes for cluster to be ready

### Database Access
- [ ] Go to "Database Access" in sidebar
- [ ] Click "Add New Database User"
- [ ] Username: `villa_ester_user`
- [ ] Password: Click "Autogenerate Secure Password"
- [ ] **SAVE THE PASSWORD** (you'll need it!)
- [ ] Privileges: "Read and write to any database"
- [ ] Click "Add User"

### Network Access
- [ ] Go to "Network Access" in sidebar
- [ ] Click "Add IP Address"
- [ ] Click "Allow Access from Anywhere" (0.0.0.0/0)
- [ ] Click "Confirm"

### Get Connection String
- [ ] Go to "Database" in sidebar
- [ ] Click "Connect" on your cluster
- [ ] Select "Connect your application"
- [ ] Driver: Node.js
- [ ] Version: 5.0 or later
- [ ] Copy the connection string

### Format Connection String
- [ ] Replace `YOUR_PASSWORD` with your actual password
- [ ] Add `/villa_ester` before the `?`
- [ ] Final format should be:
```
mongodb+srv://villa_ester_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/villa_ester?retryWrites=true&w=majority
```

### Local Setup
- [ ] Copy `backend/env.example` to `backend/.env`
- [ ] Update `MONGODB_URI` in `.env` file
- [ ] Update `MONGODB_URI_PROD` in `.env` file
- [ ] Generate a random `JWT_SECRET`
- [ ] Test connection: `cd backend && npm start`

### Database Collections (Optional)
- [ ] Go to "Browse Collections"
- [ ] Create database: `villa_ester`
- [ ] Create collection: `users`
- [ ] Create collection: `rooms`
- [ ] Create collection: `bookings`
- [ ] Create collection: `recommendations`

## 🔧 Quick Commands

```bash
# Create environment file
cp backend/env.example backend/.env

# Test if .env exists
ls -la backend/.env

# Test MongoDB connection
cd backend && npm start

# Check environment variables
cd backend && node -e "require('dotenv').config(); console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set')"
```

## 🚨 Important Notes

- **Never commit `.env` files to Git**
- **Save your database password securely**
- **Test connection locally before deploying**
- **Use different passwords for dev/prod**

## 📞 Need Help?

- Check the detailed guide: `MONGODB_SETUP.md`
- MongoDB Atlas docs: https://docs.atlas.mongodb.com/
- Common issues: See troubleshooting section in `MONGODB_SETUP.md` 

##  What is JWT Secret?

- **Purpose**: Securely sign authentication tokens
- **Type**: A long, random string
- **Security**: Must be kept secret and never shared
- **Length**: Should be at least 32 characters (longer is better)

## 🎯 How to Generate a JWT Secret:

### **Option 1: Use Node.js (Recommended)**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **Option 2: Use Online Generator**
- Go to: https://generate-secret.vercel.app/64
- Copy the generated secret

### **Option 3: Create Your Own**
Make up a long, random string like:
```
villa_ester_super_secret_jwt_key_2024_secure_authentication_token_signing_key
```

##  Example JWT Secret:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z
```

## 🛠️ How to Use It:

### **In your `.env` file:**
```env
JWT_SECRET=your_generated_secret_here
```

### **Example:**
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z
```

## ⚠️ Important Security Notes:

- **Never commit JWT_SECRET to Git**
- **Use different secrets for development and production**
- **Keep it secret and secure**
- **Make it long and random**

## 🔧 Quick Command to Generate:

Run this in your terminal:
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

This will output something like:
```
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z
```

**Copy this entire line and paste it in your `.env` file!**

**Want me to help you generate one right now?** 