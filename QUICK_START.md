# Quick Start Guide

## What Changed

### 1. Water Tracking 💧
- **Before**: Tracked in glasses (8 glasses/day)
- **After**: Tracked in liters (2.5L/day)
- **How to use**: Click "Add 250ml" to add water in 250ml increments

### 2. MongoDB Integration 🗄️
All your fitness data is now saved to MongoDB:
- Water intake (liters)
- Calories consumed
- Exercise minutes
- Daily goals

### 3. Data Persistence 💾
- Data automatically saves when you click buttons
- Data loads when you open the app
- Summary shows real historical data

## Getting Started

### Step 1: Install & Start MongoDB

**Option A - Local MongoDB** (Recommended):
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

**Option B - MongoDB Atlas** (Cloud):
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account and cluster
3. Copy connection string to `.env.local`

### Step 2: Start Your App
```bash
cd frontend
npm run dev
```

### Step 3: Open Browser
```
http://localhost:3000
```

## Test It Out

1. **Add Water**: Click "Add 250ml" button
2. **Add Food**: Click any food button (Salad, Chicken, etc.)
3. **Add Exercise**: Click any activity (Running, Weights, etc.)
4. **View Summary**: Click "Summary" tab, toggle Day/Month/Year
5. **Refresh Page**: Your data should persist!

## Environment File

Your `.env.local` file has been created with:
```
MONGODB_URI=mongodb://localhost:27017/fitness-tracker
```

If using MongoDB Atlas, replace with your connection string.

## Verify MongoDB Connection

```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Connect to MongoDB
mongosh

# View your data
use fitness-tracker
db.fitnesslogs.find().pretty()
```

## Need Help?

See `MONGODB_SETUP.md` for detailed documentation including:
- Complete setup instructions
- Database schema details
- API endpoint documentation
- Troubleshooting guide
- Next steps and enhancements

---

**Important**: Make sure MongoDB is running before starting your app!
