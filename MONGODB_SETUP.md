# Fitness Tracker - MongoDB Setup Guide

## Overview
Your fitness tracker app is now integrated with MongoDB to persist all tracking data including water intake (in liters), calories, and exercise minutes.

## What's Been Implemented

### 1. MongoDB Integration
- **Database Connection**: `lib/mongodb.ts` - Handles MongoDB connection with caching
- **Data Model**: `models/FitnessLog.ts` - Schema for fitness tracking data
- **API Routes**:
  - `GET/PUT /api/fitness` - Fetch and update today's fitness data
  - `GET /api/fitness/summary?period=day|month|year` - Get summary statistics

### 2. Water Tracking Updates
- Changed from **glasses** to **liters**
- Default daily goal: **2.5 liters**
- Each button click adds **250ml (0.25L)**
- Visual display shows 10 boxes, each representing 250ml

### 3. Data Persistence
- All data (water, calories, exercise) is automatically saved to MongoDB
- Data persists across sessions
- Summary tab shows real historical data from MongoDB

## Setup Instructions

### Option 1: Local MongoDB (Recommended for Development)

1. **Install MongoDB** (if not already installed):
   ```bash
   # macOS
   brew tap mongodb/brew
   brew install mongodb-community
   
   # Start MongoDB
   brew services start mongodb-community
   ```

2. **Verify MongoDB is running**:
   ```bash
   mongosh
   # Should connect to mongodb://127.0.0.1:27017
   ```

3. **Update `.env.local`** (already created):
   ```
   MONGODB_URI=mongodb://localhost:27017/fitness-tracker
   ```

4. **Start the development server**:
   ```bash
   cd frontend
   npm run dev
   ```

### Option 2: MongoDB Atlas (Cloud)

1. **Create a free MongoDB Atlas account**: https://www.mongodb.com/cloud/atlas

2. **Create a cluster** and get your connection string

3. **Update `.env.local`**:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/fitness-tracker?retryWrites=true&w=majority
   ```

4. **Whitelist your IP address** in Atlas Network Access settings

5. **Start the development server**:
   ```bash
   cd frontend
   npm run dev
   ```

## Database Schema

### FitnessLog Collection
```typescript
{
  date: Date,              // Date of the log (midnight timestamp)
  waterLiters: Number,     // Water consumed in liters (0-2.5+)
  waterGoal: Number,       // Daily water goal in liters (default: 2.5)
  calories: Number,        // Calories consumed (0-2000+)
  calorieGoal: Number,     // Daily calorie goal (default: 2000)
  exerciseMinutes: Number, // Exercise time in minutes (0-60+)
  exerciseGoal: Number,    // Daily exercise goal (default: 60)
  createdAt: Date,         // Auto-generated
  updatedAt: Date          // Auto-generated
}
```

## Features

### Current Features
✅ Water tracking in liters (250ml increments)
✅ Calorie tracking with preset meal buttons
✅ Exercise tracking with preset activity buttons
✅ Daily, monthly, and yearly summaries
✅ All data persisted to MongoDB
✅ Automatic data fetching on page load
✅ Real-time progress updates

### How It Works

1. **Page Load**: 
   - Fetches today's fitness data from MongoDB
   - If no data exists for today, creates a new entry

2. **Adding Data**:
   - Click buttons to add water, calories, or exercise
   - Data is immediately saved to MongoDB
   - Summary is refreshed automatically

3. **Summary Tab**:
   - Switch between Day/Month/Year views
   - Fetches real aggregated data from MongoDB
   - Shows total consumption across selected period

## Testing the Connection

1. **Start MongoDB** (if using local):
   ```bash
   brew services start mongodb-community
   ```

2. **Start the app**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test the features**:
   - Add some water (click "Add 250ml")
   - Add calories (click a food item)
   - Add exercise (click an activity)
   - Check the Summary tab

4. **Verify data persistence**:
   - Refresh the page
   - Data should remain
   
5. **Check MongoDB** (optional):
   ```bash
   mongosh
   use fitness-tracker
   db.fitnesslogs.find().pretty()
   ```

## Troubleshooting

### Connection Error
- **Error**: "Failed to fetch fitness log"
- **Solution**: Make sure MongoDB is running and the connection string in `.env.local` is correct

### Data Not Saving
- **Check**: Browser console for errors
- **Check**: MongoDB is running (`brew services list`)
- **Check**: `.env.local` file exists and has correct URI

### Port Already in Use
- **Error**: MongoDB port 27017 already in use
- **Solution**: 
  ```bash
  # Check what's using the port
  lsof -i :27017
  
  # Kill the process if needed
  kill -9 <PID>
  ```

## Next Steps

### Recommended Enhancements
1. **User Authentication**: Add user accounts to track multiple users
2. **Data Visualization**: Add charts for weekly/monthly trends
3. **Custom Goals**: Allow users to set their own daily goals
4. **Meal Database**: Create a comprehensive food database
5. **Exercise Library**: Expand exercise options with custom entries
6. **Notifications**: Remind users to drink water or exercise

## API Endpoints

### GET /api/fitness
Fetches today's fitness log or creates a new one if it doesn't exist.

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "date": "2026-01-01T00:00:00.000Z",
    "waterLiters": 1.5,
    "waterGoal": 2.5,
    "calories": 800,
    "calorieGoal": 2000,
    "exerciseMinutes": 30,
    "exerciseGoal": 60
  }
}
```

### PUT /api/fitness
Updates today's fitness log.

**Request Body**:
```json
{
  "waterLiters": 2.0,
  "calories": 1200,
  "exerciseMinutes": 45
}
```

### GET /api/fitness/summary?period=day|month|year
Gets aggregated summary for the specified period.

**Response**:
```json
{
  "success": true,
  "data": {
    "period": "month",
    "water": {
      "consumed": 45.5,
      "goal": 75.0,
      "percentage": 61
    },
    "calories": {
      "consumed": 42000,
      "goal": 60000,
      "percentage": 70
    },
    "exercise": {
      "minutes": 900,
      "goal": 1800,
      "percentage": 50
    },
    "totalDays": 30
  }
}
```

## Files Modified/Created

### New Files
- `frontend/.env.local` - Environment variables
- `frontend/lib/mongodb.ts` - Database connection
- `frontend/models/FitnessLog.ts` - Data model
- `frontend/app/api/fitness/route.ts` - Main API endpoint
- `frontend/app/api/fitness/summary/route.ts` - Summary endpoint

### Modified Files
- `frontend/app/page.tsx` - Updated to use MongoDB and liters
- `frontend/package.json` - Added mongoose dependency

---

**Note**: Make sure to add `.env.local` to your `.gitignore` file to avoid committing sensitive credentials!
