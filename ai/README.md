# AI Cottage Recommendation System

## Overview
This is a simple but effective machine learning recommendation system that analyzes booking patterns, ratings, guest counts, and special requests to recommend the best cottage for guests.

## Features

### 🤖 Smart Analysis
- **Best Selling Cottages**: Analyzes which cottages are most frequently booked
- **Rating Analysis**: Considers guest ratings and reviews
- **Guest Count Optimization**: Matches cottage capacity to guest count
- **Special Occasion Detection**: Identifies birthdays, parties, and celebrations

### 🎉 Special Features
- **VE Cottage Priority**: Automatically recommends VE Cottage for celebrations (birthdays, parties)
- **Videoke Detection**: Recognizes requests for videoke/karaoke and suggests appropriate cottages
- **Peak Season Analysis**: Considers seasonal booking patterns

## How It Works

### Scoring System (100 points total)
- **Popularity Score** (30 points): Based on booking frequency
- **Rating Score** (25 points): Based on average guest ratings
- **Guest Fit Score** (25 points): How well cottage capacity matches guest count
- **Special Occasion Bonus** (20 points): Extra points for celebrations and special requests

### Special Request Detection
The system recognizes keywords like:
- **Birthday**: "birthday", "birth day", "bday", "celebration"
- **Party**: "party", "celebration", "gathering", "event"
- **Videoke**: "videoke", "karaoke", "singing", "music"
- **Anniversary**: "anniversary", "wedding anniversary"

## Usage

### From Node.js Backend
```javascript
// The backend automatically calls the Python script
// when recommendations are requested via API
GET /api/recommendations?guest_count=4&booking_date=2024-01-15&special_requests=birthday
```

### Direct Python Usage
```python
from simple_recommender import SimpleCottageRecommender

recommender = SimpleCottageRecommender()
recommender.load_data(cottages, bookings, reviews)

recommendations = recommender.recommend_cottages(
    guest_count=4,
    booking_date='2024-01-15',
    special_requests='Birthday celebration with videoke'
)
```

## Example Output
```json
[
  {
    "cottage_id": "ve_cottage",
    "name": "VE Cottage",
    "description": "Perfect for celebrations with videoke system",
    "price": 2500,
    "capacity": "4-6 people",
    "image": "vecottage.jpg",
    "score": 115.83,
    "reasons": [
      "Popular choice - 1 bookings",
      "Highly rated - 5.0/5 stars", 
      "Perfect fit for 4 guests",
      "Great for celebrations with videoke"
    ]
  }
]
```

## Requirements
- Python 3.6+
- No external dependencies (uses only standard library)

## Files
- `simple_recommender.py`: Main recommendation engine
- `recommender.py`: Full Flask API version (requires additional packages)
- `requirements.txt`: Python package dependencies (for Flask version)

## Integration
The system is integrated into the resort management system:
1. Frontend calls `/api/recommendations` with guest preferences
2. Backend fetches data from MongoDB
3. Python script analyzes data and returns recommendations
4. Frontend displays personalized recommendations with reasons

## Benefits
- **Personalized**: Recommendations based on actual guest preferences
- **Smart**: Learns from booking patterns and ratings
- **Special Occasion Aware**: Perfect for celebrations and events
- **Simple**: No complex ML models, easy to understand and maintain
- **Fast**: Lightweight and efficient 