# Villa Ester Resort Full Stack Project

## Overview
A full-stack hotel booking and AI recommendation web app for Villa Ester Resort.

## Structure
- `/frontend`: Static files (HTML, CSS, JS)
- `/backend`: Node.js/Express API server
- `/ai`: AI recommendation logic (Python or Node.js)
- `MongoDB`: Database for bookings, rooms, users

## Setup

### Prerequisites
- Node.js & npm
- Python 3 (for advanced AI)
- MongoDB

### Backend
1. `cd backend`
2. `npm install`
3. Create `.env` (see `.env.example`)
4. `npm start`

### Frontend
- Open `frontend/index.html` in your browser (or serve with a static server)

### AI Service (Optional)
1. `cd ai`
2. `pip install -r requirements.txt`
3. `python recommender.py`

## API Endpoints
- `/api/rooms` - Get rooms
- `/api/bookings` - Manage bookings
- `/api/recommendations` - Get AI recommendations

## Environment Variables
See `.env.example` for required variables. 