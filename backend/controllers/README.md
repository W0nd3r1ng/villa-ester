# Booking System Backend

A comprehensive Node.js/Express backend for a reservation website with full CRUD operations, authentication, validation, and advanced features.

## Features

- ✅ **Full CRUD Operations** - Create, Read, Update, Delete bookings
- ✅ **Authentication & Authorization** - JWT-based auth with role-based access
- ✅ **Data Validation** - Comprehensive input validation using express-validator
- ✅ **Pagination & Filtering** - Advanced query capabilities
- ✅ **Availability Checking** - Real-time slot availability verification
- ✅ **Booking Statistics** - Analytics and reporting features
- ✅ **Error Handling** - Robust error management
- ✅ **Database Integration** - MongoDB with Mongoose ODM
- ✅ **Security** - Rate limiting, CORS, Helmet protection

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)
- [Security Features](#security-features)

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd booking-system-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/booking-system
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/booking-system` |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRE` | JWT expiration time | `7d` |

## API Documentation

### Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Booking Endpoints

#### 1. Get All Bookings
```http
GET /api/bookings
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `status` (string): Filter by status
- `userId` (string): Filter by user ID
- `startDate` (string): Filter by start date (ISO format)
- `endDate` (string): Filter by end date (ISO format)
- `sortBy` (string): Sort field (createdAt, bookingDate, status, totalPrice)
- `sortOrder` (string): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "booking-id",
      "userId": {
        "_id": "user-id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "serviceId": {
        "_id": "service-id",
        "name": "Spa Treatment",
        "price": 100,
        "duration": 60
      },
      "bookingDate": "2024-01-15T00:00:00.000Z",
      "bookingTime": "14:00",
      "duration": 60,
      "numberOfPeople": 1,
      "status": "confirmed",
      "totalPrice": 100,
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

#### 2. Create Booking
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user-id",
  "serviceId": "service-id",
  "bookingDate": "2024-01-15",
  "bookingTime": "14:00",
  "duration": 60,
  "numberOfPeople": 1,
  "contactPhone": "+1234567890",
  "contactEmail": "john@example.com",
  "specialRequests": "Window seat preferred"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "_id": "booking-id",
    "userId": {
      "_id": "user-id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "serviceId": {
      "_id": "service-id",
      "name": "Spa Treatment",
      "price": 100,
      "duration": 60
    },
    "bookingDate": "2024-01-15T00:00:00.000Z",
    "bookingTime": "14:00",
    "duration": 60,
    "numberOfPeople": 1,
    "status": "pending",
    "createdAt": "2024-01-10T10:00:00.000Z"
  }
}
```

#### 3. Get Booking by ID
```http
GET /api/bookings/:id
Authorization: Bearer <token>
```

#### 4. Update Booking
```http
PUT /api/bookings/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "bookingTime": "15:00",
  "numberOfPeople": 2,
  "specialRequests": "Updated special requests"
}
```

#### 5. Cancel Booking
```http
PATCH /api/bookings/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "cancellationReason": "Change of plans"
}
```

#### 6. Delete Booking (Admin Only)
```http
DELETE /api/bookings/:id
Authorization: Bearer <token>
```

#### 7. Get User Bookings
```http
GET /api/bookings/user/:userId
Authorization: Bearer <token>
```

#### 8. Get Booking Statistics
```http
GET /api/bookings/stats
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (string): Start date for statistics (ISO format)
- `endDate` (string): End date for statistics (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "pending": 25,
    "confirmed": 80,
    "completed": 35,
    "cancelled": 10,
    "statusBreakdown": [
      { "_id": "pending", "count": 25 },
      { "_id": "confirmed", "count": 80 },
      { "_id": "completed", "count": 35 },
      { "_id": "cancelled", "count": 10 }
    ]
  }
}
```

#### 9. Check Availability
```http
GET /api/bookings/availability?serviceId=service-id&bookingDate=2024-01-15&bookingTime=14:00
```

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "existingBooking": null
  }
}
```

## Database Schema

### Booking Model

```javascript
{
  userId: ObjectId,           // Reference to User
  serviceId: ObjectId,        // Reference to Service
  bookingDate: Date,          // Required, cannot be in past
  bookingTime: String,        // Required, HH:MM format
  duration: Number,           // Required, 15-480 minutes
  numberOfPeople: Number,     // Required, 1-50 people
  specialRequests: String,    // Optional, max 500 chars
  contactPhone: String,       // Required, validated format
  contactEmail: String,       // Required, validated email
  status: String,             // pending, confirmed, completed, cancelled, rejected
  cancellationReason: String, // Optional, max 200 chars
  totalPrice: Number,         // Optional, min 0
  paymentStatus: String,      // pending, paid, refunded, failed
  paymentMethod: String,      // credit_card, debit_card, paypal, cash, bank_transfer
  notes: String,              // Optional, max 1000 chars
  confirmedAt: Date,          // Auto-set when confirmed
  completedAt: Date,          // Auto-set when completed
  cancelledAt: Date,          // Auto-set when cancelled
  createdAt: Date,            // Auto-set
  updatedAt: Date             // Auto-updated
}
```

## Usage Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

// Create a booking
const createBooking = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/bookings', {
      userId: 'user-id',
      serviceId: 'service-id',
      bookingDate: '2024-01-15',
      bookingTime: '14:00',
      duration: 60,
      numberOfPeople: 1,
      contactPhone: '+1234567890',
      contactEmail: 'john@example.com'
    }, {
      headers: {
        'Authorization': 'Bearer your-jwt-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Booking created:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};

// Get all bookings with filtering
const getBookings = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/bookings', {
      params: {
        page: 1,
        limit: 10,
        status: 'confirmed',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      },
      headers: {
        'Authorization': 'Bearer your-jwt-token'
      }
    });
    
    console.log('Bookings:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};
```

### cURL Examples

```bash
# Create a booking
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "serviceId": "service-id",
    "bookingDate": "2024-01-15",
    "bookingTime": "14:00",
    "duration": 60,
    "numberOfPeople": 1,
    "contactPhone": "+1234567890",
    "contactEmail": "john@example.com"
  }'

# Get all bookings
curl -X GET "http://localhost:5000/api/bookings?page=1&limit=10&status=confirmed" \
  -H "Authorization: Bearer your-jwt-token"

# Check availability
curl -X GET "http://localhost:5000/api/bookings/availability?serviceId=service-id&bookingDate=2024-01-15&bookingTime=14:00"
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., time slot already booked)
- `500` - Internal Server Error

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Admin, staff, and user roles
- **Input Validation** - Comprehensive validation using express-validator
- **Rate Limiting** - Protection against brute force attacks
- **CORS Protection** - Cross-origin resource sharing control
- **Helmet Security** - Security headers protection
- **Data Sanitization** - Input sanitization and validation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@yourcompany.com or create an issue in the repository. 