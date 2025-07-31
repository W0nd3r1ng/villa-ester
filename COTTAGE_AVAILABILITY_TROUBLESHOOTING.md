# Cottage Availability Troubleshooting Guide

## Issue: Intermittent Cottage Availability Problems

### Symptoms
- Cottage availability works fine locally but fails intermittently online
- Sometimes the system shows cottages as unavailable when they should be available
- Date/time queries return inconsistent results

### Root Causes & Solutions

## 1. Timezone Issues (Most Common)

**Problem**: Different timezone settings between local and production environments cause date comparison issues.

**Solution**: 
- ✅ **Fixed**: Updated date handling to use UTC consistently
- ✅ **Fixed**: Added robust date parsing with validation
- ✅ **Fixed**: Enhanced error handling for invalid dates

**Code Changes Made**:
```javascript
// Before (problematic)
const bookingDateStart = new Date(bookingDate);
bookingDateStart.setHours(0, 0, 0, 0);

// After (fixed)
const parsedDate = new Date(bookingDate);
if (isNaN(parsedDate.getTime())) {
  return res.status(400).json({
    success: false,
    message: 'Invalid date format'
  });
}
bookingDateStart = new Date(parsedDate);
bookingDateStart.setUTCHours(0, 0, 0, 0);
```

## 2. MongoDB Connection Issues

**Problem**: Connection timeouts or disconnections in production environment.

**Solution**:
- ✅ **Fixed**: Enhanced MongoDB connection with retry logic
- ✅ **Fixed**: Added connection pooling and timeout settings
- ✅ **Fixed**: Added automatic reconnection on disconnect

**Code Changes Made**:
```javascript
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2
};
```

## 3. Query Performance Issues

**Problem**: Slow queries causing timeouts in production.

**Solution**:
- ✅ **Fixed**: Added query timeout settings
- ✅ **Fixed**: Enhanced query options with maxTimeMS
- ✅ **Fixed**: Added better error handling for query failures

## 4. Environment-Specific Issues

### Production Environment Checklist

1. **Environment Variables**:
   ```bash
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000 (or your deployment port)
   ```

2. **Database Connection**:
   - Ensure MongoDB Atlas (or your DB) is accessible from your deployment
   - Check IP whitelist settings
   - Verify connection string format

3. **Logging**:
   - Check deployment logs for errors
   - Monitor MongoDB connection status
   - Look for timeout errors

### Testing the Fix

1. **Local Testing**:
   ```bash
   cd backend
   npm run start
   ```

2. **Run Test Script**:
   ```bash
   node test-cottage-availability.js
   ```

3. **Production Testing**:
   ```bash
   # Set your production URL
   export TEST_URL=https://your-deployment-url.com
   node test-cottage-availability.js
   ```

## 5. Debugging Steps

### Step 1: Check Server Logs
Look for these log messages:
```
=== COTTAGE AVAILABILITY ROUTE HIT ===
Date range for query: { start: "...", end: "..." }
Existing bookings for this date/time: X
Available numbers: [1, 2, 3]
```

### Step 2: Verify Date Format
Ensure dates are being sent in ISO format: `YYYY-MM-DD`

### Step 3: Check MongoDB Connection
Look for:
```
MongoDB connected successfully
```

### Step 4: Test API Endpoint
```bash
curl "http://localhost:3000/api/bookings/get-cottage-numbers?cottageType=kubo&bookingDate=2024-01-15&bookingTime=day"
```

## 6. Common Error Messages & Solutions

### "Invalid date format"
- **Cause**: Date string not in correct format
- **Solution**: Ensure dates are sent as `YYYY-MM-DD`

### "MongoDB connection error"
- **Cause**: Database connection issues
- **Solution**: Check connection string and network access

### "Failed to fetch available cottage numbers"
- **Cause**: Query timeout or database error
- **Solution**: Check MongoDB status and connection

## 7. Monitoring & Prevention

### Add to your deployment:
1. **Health Check Endpoint**:
   ```javascript
   app.get('/health', (req, res) => {
     res.json({
       status: 'ok',
       timestamp: new Date().toISOString(),
       mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
     });
   });
   ```

2. **Enhanced Logging**:
   - Log all cottage availability requests
   - Monitor response times
   - Track error rates

3. **Alerting**:
   - Set up alerts for MongoDB disconnections
   - Monitor API response times
   - Track 500 error rates

## 8. Performance Optimization

### For High Traffic:
1. **Add Caching**:
   ```javascript
   const NodeCache = require('node-cache');
   const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes
   ```

2. **Database Indexing**:
   ```javascript
   // Add to your Booking model
   bookingSchema.index({ cottageType: 1, bookingDate: 1, bookingTime: 1 });
   ```

3. **Query Optimization**:
   - Use projection to limit returned fields
   - Add proper indexes
   - Consider pagination for large datasets

## 9. Deployment Checklist

Before deploying:
- [ ] Test locally with production-like data
- [ ] Verify environment variables
- [ ] Check MongoDB connection
- [ ] Run test script against staging
- [ ] Monitor logs after deployment
- [ ] Test cottage availability functionality

## 10. Emergency Rollback

If issues persist:
1. **Revert to previous version**
2. **Check MongoDB logs**
3. **Verify network connectivity**
4. **Test with minimal data**
5. **Gradually increase load**

---

**Last Updated**: January 2024
**Version**: 1.0
**Status**: ✅ Implemented fixes for timezone and connection issues 