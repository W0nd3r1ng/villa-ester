# Network Access Setup Guide

## Problem: Cottage Numbers Show "Error Loading Numbers" on Other Devices

### Root Cause
Your local development server is only accessible from your development machine. Other devices (phone, tablet, other computers) cannot reach `localhost:3000`.

### Solution: Enable Network Access

## Step 1: Update Server Configuration ✅

The server has been updated to bind to all network interfaces (`0.0.0.0`) instead of just localhost.

## Step 2: Find Your Local IP Address

Run this command to get your network information:

```bash
node get-network-info.js
```

This will show you:
- Your local IP address (e.g., `192.168.1.100`)
- Network access URLs
- Testing instructions

## Step 3: Start the Server

```bash
cd backend
npm start
```

You should see output like:
```
Server running on http://0.0.0.0:5000
Local access: http://localhost:5000
Network access: http://[YOUR_LOCAL_IP]:5000
Example: http://192.168.1.100:5000
```

## Step 4: Test from Other Devices

### From Your Phone:
1. Make sure your phone is connected to the same WiFi network
2. Open browser on your phone
3. Go to: `http://[YOUR_LOCAL_IP]:5000`
   - Example: `http://192.168.1.100:5000`
4. Test the cottage availability functionality

### From Another Computer:
1. Make sure both computers are on the same network
2. Open browser on the other computer
3. Go to: `http://[YOUR_LOCAL_IP]:5000`

## Step 5: Troubleshooting

### If Connection Fails:

#### Windows Firewall:
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change settings"
4. Click "Allow another app"
5. Browse to your Node.js executable
6. Make sure both Private and Public are checked

#### Alternative: Temporarily Disable Firewall
```bash
# Run as Administrator
netsh advfirewall set allprofiles state off
# Remember to turn it back on after testing
netsh advfirewall set allprofiles state on
```

#### Check Port Usage:
```bash
# Check if port 5000 is in use
netstat -an | findstr :5000
```

#### Use Different Port:
```bash
# Set different port
set PORT=3001
npm start
```

## Step 6: Test API Endpoints

### Test Cottage Availability API:
```bash
# Direct API test
curl "http://[YOUR_LOCAL_IP]:5000/api/bookings/get-cottage-numbers?cottageType=kubo&bookingDate=2024-01-15&bookingTime=day"
```

### Run Test Script:
```bash
# Test locally
node test-cottage-availability.js

# Test with network URL
set TEST_URL=http://[YOUR_LOCAL_IP]:5000
node test-cottage-availability.js
```

## Step 7: Verify CORS Configuration

The server is configured to allow all origins:
```javascript
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
}));
```

## Common Issues & Solutions

### Issue 1: "Connection Refused"
**Cause**: Firewall blocking the connection
**Solution**: Allow Node.js through firewall or temporarily disable firewall

### Issue 2: "Cannot Reach Server"
**Cause**: Wrong IP address or port
**Solution**: 
1. Run `node get-network-info.js` to get correct IP
2. Make sure both devices are on same network
3. Try different port: `set PORT=3001 && npm start`

### Issue 3: "CORS Error"
**Cause**: Browser blocking cross-origin requests
**Solution**: CORS is already configured to allow all origins

### Issue 4: "Cottage Numbers Still Show Error"
**Cause**: Network connectivity or API endpoint issues
**Solution**:
1. Test API directly: `http://[YOUR_LOCAL_IP]:5000/api/bookings/get-cottage-numbers?cottageType=kubo&bookingDate=2024-01-15&bookingTime=day`
2. Check server logs for errors
3. Verify MongoDB connection

## Testing Checklist

- [ ] Server starts without errors
- [ ] Network info script shows your IP address
- [ ] Can access `http://localhost:5000` from development machine
- [ ] Can access `http://[YOUR_IP]:5000` from development machine
- [ ] Can access from phone/other device
- [ ] Cottage availability works from other devices
- [ ] No CORS errors in browser console

## Security Notes

⚠️ **Important**: This setup is for development/testing only!

- Only use this on trusted networks
- Don't expose your development server to the internet
- Use proper authentication in production
- Consider using a VPN for remote testing

## Production Deployment

For production, you should:
1. Deploy to a proper hosting service (Heroku, Vercel, etc.)
2. Use HTTPS
3. Configure proper CORS for your domain
4. Set up proper environment variables

---

**Status**: ✅ Network access configuration implemented
**Next Step**: Test from your phone using the network URL 