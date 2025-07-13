# Villa Ester Resort - Booking System Update

## Overview
The booking system has been updated to connect the "Book Now" functionality in the index page to the database, allowing users to save bookings directly to the database. The cottage types have also been updated to match the Atlas database structure.

## Changes Made

### 1. Database Models Updated

#### Cottage Model (`backend/models/cottage.js`)
- Updated to match Atlas database structure
- Added proper validation and indexing
- Fields: name, description, price, capacity (string), amenities (array), image, available, type

#### Booking Model (`backend/models/Booking.js`)
- Updated to work with cottages instead of services
- Added `cottageId`, `cottageType`, and `fullName` fields
- Made `userId` optional for walk-in bookings
- Updated validation and methods

### 2. Backend Controllers Updated

#### Booking Controller (`backend/controllers/bookingController.js`)
- Updated to work with cottage-based bookings
- Added cottage availability checking
- Updated booking creation to find cottages by type
- Added proper error handling and validation

#### Cottage Controller (`backend/controllers/cottageController.js`)
- Simple controller for fetching cottages from database

### 3. Frontend Updates

#### Index.html
- Updated cottage type options to match Atlas database:
  - Kubo Type - ₱800 (10-15 guests)
  - VE Cottage with Videoke - ₱2,500 (20-25 guests)
  - VE Cottage without Videoke - ₱2,000 (20-25 guests)
  - Garden Table - ₱300 (5 guests)

#### Script.js
- Updated booking submission to work with new cottage types
- Added validation for cottage type selection
- Updated cottage display to show proper information
- Fixed capacity parsing for string values (e.g., "10-15")

### 4. Validation and Routes

#### Booking Validation (`backend/middleware/bookingValidation.js`)
- Updated to validate cottage types instead of service IDs
- Made userId optional for walk-in bookings
- Added proper validation for new fields

#### Booking Routes (`backend/routes/bookingRoutes.js`)
- Updated routes to match new controller methods
- Removed authentication requirement for booking creation
- Added new routes for booking confirmation and completion

## Database Setup

### 1. Populate Cottages
Run the following command to populate the database with cottage data:

```bash
cd backend
npm run populate-cottages
```

This will add the following cottages to your database:
- Kubo Type (₱800, 10-15 guests)
- VE Cottage with Videoke (₱2,500, 20-25 guests)
- VE Cottage without Videoke (₱2,000, 20-25 guests)
- Garden Table (₱300, 5 guests)

### 2. Environment Variables
Make sure your `.env` file contains:
```
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=your_frontend_url
```

## How to Use

### 1. Booking Flow
1. User clicks "Book Now" button on the index page
2. Booking modal opens with cottage type selection
3. User fills in booking details (name, contact info, dates, etc.)
4. User uploads proof of payment
5. Booking is saved to database with "pending" status
6. Admin can confirm/complete bookings through admin panel

### 2. Cottage Availability
- The system checks cottage availability based on existing bookings
- Cottages are filtered by capacity and availability status
- Users can search for available cottages by date and guest count

### 3. Booking Status
- **Pending**: New booking awaiting confirmation
- **Confirmed**: Booking confirmed by admin
- **Completed**: Booking has been fulfilled
- **Cancelled**: Booking cancelled
- **Rejected**: Booking rejected by admin

## API Endpoints

### Public Endpoints
- `POST /api/bookings` - Create new booking
- `GET /api/cottages` - Get all cottages
- `GET /api/bookings/availability` - Check cottage availability
- `GET /api/bookings/date-range` - Get bookings by date range

### Protected Endpoints (Admin)
- `GET /api/bookings` - Get all bookings with filtering
- `PATCH /api/bookings/:id/confirm` - Confirm booking
- `PATCH /api/bookings/:id/complete` - Complete booking
- `PATCH /api/bookings/:id/cancel` - Cancel booking
- `DELETE /api/bookings/:id` - Delete booking

## Features

### 1. Real-time Updates
- Socket.IO integration for real-time booking notifications
- Admin panel receives instant updates when new bookings are created

### 2. File Upload
- Proof of payment images are stored in `/uploads/proof/` directory
- File validation and secure storage

### 3. Validation
- Comprehensive form validation on both frontend and backend
- Date/time validation to prevent past bookings
- Capacity validation based on cottage limits

### 4. Error Handling
- Proper error messages for validation failures
- Database error handling and user-friendly messages

## Testing the System

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Open the frontend in a browser and navigate to the index page

3. Click "Book Now" and test the booking flow

4. Check the database to verify bookings are being saved

5. Test the admin panel to confirm/complete bookings

## Troubleshooting

### Common Issues

1. **Cottage not found error**: Make sure to run the populate script first
2. **Validation errors**: Check that all required fields are filled
3. **File upload issues**: Ensure the uploads directory exists and has proper permissions
4. **Database connection**: Verify your MongoDB connection string is correct

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## Future Enhancements

1. Email notifications for booking confirmations
2. Payment gateway integration
3. Advanced availability calendar
4. User account management
5. Booking history for users
6. Analytics and reporting dashboard 