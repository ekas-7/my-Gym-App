# AI-Powered Diet Tracking - Complete Guide

## Overview

Your fitness app now features **Gemini AI-powered nutrition tracking** that automatically calculates calories, carbs, fats, and protein from natural language food descriptions!

---

## What Changed

### 1. Emoji-Free UI ✅
- Removed all emojis from components
- Replaced with consistent text labels and icons
- Clean, professional design throughout

### 2. AI Diet Analysis ✅
- Natural language food input
- Automatic macro calculation using Gemini AI
- Real-time nutrition tracking
- Detailed macro breakdown

### 3. Enhanced Nutrition Tracking ✅
- Calories
- Carbohydrates (grams)
- Fats (grams)
- Protein (grams)
- Individual progress bars for each macro

---

## Setup Instructions

### 1. Get Your Gemini API Key

1. Visit https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure Environment Variable

Edit `/frontend/.env.local` and replace `your_gemini_api_key_here` with your actual key:

```bash
GEMINI_API_KEY=AIzaSy...your-actual-key-here
```

### 3. Restart Development Server

```bash
cd frontend
npm run dev
```

---

## How to Use

### Diet Tab - AI Food Analysis

1. **Go to the "Diet" tab**

2. **Describe your meal in plain English**
   - Example: "2 scrambled eggs, whole wheat toast with butter, banana"
   - Example: "Grilled chicken breast 200g, brown rice 1 cup, broccoli"
   - Example: "Large cappuccino, blueberry muffin"

3. **Click "Add Food" or press Enter**

4. **AI automatically calculates:**
   - Total calories
   - Carbohydrates in grams
   - Fats in grams
   - Protein in grams

5. **View your progress:**
   - Each macro shows current vs. goal
   - Progress bars for visual tracking
   - Macro distribution percentages

---

## Features

### Natural Language Understanding

The AI understands various formats:

**✅ Specific portions:**
- "150g chicken breast"
- "1 cup of rice"
- "2 tablespoons peanut butter"

**✅ Common descriptions:**
- "Large burger with fries"
- "Bowl of pasta with meatballs"
- "Protein shake"

**✅ Multiple items:**
- "Apple, banana, orange"
- "Oatmeal with milk and honey"
- "Salad with chicken and dressing"

**✅ Meals:**
- "Breakfast: eggs, bacon, toast"
- "Lunch at McDonald's: Big Mac, medium fries, Coke"
- "Dinner: salmon, sweet potato, asparagus"

### Macro Tracking

**4 Key Metrics:**

1. **Calories** (kcal)
   - Target: 2,300 kcal/day
   - Adjusts based on your goals

2. **Carbohydrates** (grams)
   - Target: 250g/day
   - Energy for workouts

3. **Fats** (grams)
   - Target: 65g/day
   - Essential hormones & absorption

4. **Protein** (grams)
   - Target: 190g/day
   - Muscle preservation during cut

### Real-Time Updates

- Instant macro calculation
- Progress bars update live
- Saves to MongoDB automatically
- Syncs with streak tracking

---

## UI Components

### Macro Cards

```
┌────────────┬────────────┬────────────┬────────────┐
│ Calories   │ Carbs      │ Fats       │ Protein    │
│  1,250     │  125.5g    │  42.3g     │  95.2g     │
│ / 2,300    │ / 250g     │ / 65g      │ / 190g     │
│ [████░░░]  │ [████░░░]  │ [████░░░]  │ [████░░░]  │
└────────────┴────────────┴────────────┴────────────┘
```

### Macro Distribution

Shows percentage of each macro goal completed:
- Carbs: 50%
- Fats: 65%
- Protein: 50%

### Food Input

```
┌─────────────────────────────────────────────────┐
│ Describe your meal                              │
├─────────────────────────────────────────────────┤
│ [2 eggs, toast, banana, coffee     ] [Add Food] │
│                                                  │
│ Powered by Gemini AI                            │
└─────────────────────────────────────────────────┘
```

---

## Example Usage

### Morning

**Input:**
```
2 scrambled eggs with cheese, whole wheat toast with avocado, black coffee
```

**AI Returns:**
- Calories: 420 kcal
- Carbs: 28g
- Fats: 24g
- Protein: 26g

### Lunch

**Input:**
```
Grilled chicken salad: 150g chicken, mixed greens, cucumber, tomatoes, olive oil dressing
```

**AI Returns:**
- Calories: 380 kcal
- Carbs: 12g
- Fats: 18g
- Protein: 42g

### Snack

**Input:**
```
Protein shake with banana and peanut butter
```

**AI Returns:**
- Calories: 280 kcal
- Carbs: 32g
- Fats: 8g
- Protein: 30g

### Dinner

**Input:**
```
200g salmon, 1 cup brown rice, roasted vegetables
```

**AI Returns:**
- Calories: 580 kcal
- Carbs: 55g
- Fats: 18g
- Protein: 38g

### Daily Total

After all meals:
- **Calories:** 1,660 / 2,300 (72%)
- **Carbs:** 127g / 250g (51%)
- **Fats:** 68g / 65g (105%) ⚠️
- **Protein:** 136g / 190g (72%)

---

## Database Schema

### FitnessLog Model

Added new fields:

```typescript
{
  // Existing
  calories: number,
  calorieGoal: number,
  
  // NEW: Macros
  carbs: number,          // Grams consumed
  carbsGoal: number,      // Target grams (250)
  fats: number,           // Grams consumed
  fatsGoal: number,       // Target grams (65)
  protein: number,        // Grams consumed
  proteinGoal: number,    // Target grams (190)
}
```

---

## API Endpoint

### POST /api/diet/parse

**Request:**
```json
{
  "foodDescription": "2 eggs, toast, banana"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "calories": 350,
    "carbs": 45,
    "fats": 12,
    "protein": 18
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to analyze food description"
}
```

---

## Tips for Best Results

### Be Specific

**❌ Vague:**
- "Chicken"
- "Pasta"
- "Snack"

**✅ Specific:**
- "150g grilled chicken breast"
- "1 cup cooked pasta with marinara sauce"
- "1 apple and 10 almonds"

### Include Quantities

**Better accuracy with:**
- Weight: "200g", "100g"
- Volume: "1 cup", "2 tablespoons"
- Count: "2 eggs", "3 slices"

### Mention Cooking Method

**Affects calories:**
- "Fried chicken" vs "Grilled chicken"
- "Boiled eggs" vs "Scrambled eggs with butter"
- "Baked potato" vs "French fries"

### List All Components

**For mixed dishes:**
- ✅ "Burger with cheese, lettuce, tomato, mayo, fries on the side"
- ❌ "Burger meal"

---

## Troubleshooting

### "Gemini API key not configured"

**Solution:**
1. Check `.env.local` has `GEMINI_API_KEY`
2. Restart dev server: `npm run dev`
3. Verify key is valid at https://makersuite.google.com/

### "Failed to analyze food description"

**Possible causes:**
- API quota exceeded (free tier limit)
- Network error
- Invalid description

**Solutions:**
- Wait a few minutes and try again
- Check internet connection
- Make description more clear

### Inaccurate Results

**Improve accuracy:**
- Be more specific with portions
- Include cooking method
- Separate items with commas
- Use standard measurements

### AI Not Responding

**Check:**
1. API key is correct
2. Internet connection is stable
3. Gemini service is online
4. Browser console for errors

---

## Best Practices

### Daily Workflow

**Morning (7 AM):**
1. Log breakfast immediately
2. Check protein intake
3. Plan remaining meals

**Throughout Day:**
1. Log meals as you eat them
2. Don't wait until evening
3. Include all snacks

**Evening (9 PM):**
1. Review daily totals
2. Check macro balance
3. Adjust tomorrow's plan

### Meal Planning

**Use macro feedback:**
- High carbs today? → Lower carbs tomorrow
- Low protein? → Add protein shake
- Over fat limit? → Choose lean proteins

### Accuracy Tips

1. **Weigh food when possible**
   - "120g rice" vs "1 cup rice"
   - More accurate macro calculation

2. **Log immediately**
   - Don't rely on memory
   - Easier to describe while eating

3. **Include everything**
   - Cooking oils
   - Condiments
   - Beverages
   - Small snacks

4. **Review and adjust**
   - Compare AI results with labels
   - Learn common portion sizes
   - Build intuition over time

---

## Advanced Features

### Macro Goal Customization

Goals auto-set from your profile:
- **Carbs:** Based on activity level
- **Fats:** Based on body weight (0.65g/kg)
- **Protein:** 2g per kg lean mass (190g for cutting)

### Calorie Calculation

AI calculates using standard formulas:
- **Carbs:** 4 calories per gram
- **Protein:** 4 calories per gram
- **Fats:** 9 calories per gram

**Example:**
- 50g carbs = 200 kcal
- 30g protein = 120 kcal
- 20g fats = 180 kcal
- **Total:** 500 kcal

### Reset Function

"Reset All Nutrition" button:
- Clears all macros to 0
- Saves to database
- Useful for new day or corrections

---

## Privacy & Data

### What Gets Sent to Gemini

**Only:**
- Your food description text
- Example: "2 eggs, toast, banana"

**Never:**
- Personal information
- Health data
- Location
- Previous meals

### What Gets Stored

**In your database:**
- Calculated macros
- Total daily values
- Timestamps

**Security:**
- API key stored server-side
- Not exposed to client
- Encrypted database connection

---

## Limitations

### Free Tier Limits

Gemini API free tier:
- **60 requests per minute**
- **1,500 requests per day**

For normal use (3-6 meals/day):
- Well within limits
- Upgrade if needed for team use

### AI Accuracy

**Good for:**
- Common foods
- Standard portions
- Typical meals

**Less accurate for:**
- Homemade complex recipes
- Restaurant meals (unknown ingredients)
- Unusual ethnic foods

**Always verify** important tracking with food labels

---

## Files Modified

### New Files
- `app/api/diet/parse/route.ts` - Gemini AI endpoint

### Modified Files
- `models/FitnessLog.ts` - Added macro fields
- `app/page.tsx` - New Diet tab UI
- `.env.local` - Gemini API key
- `components/streak-stats.tsx` - Removed emojis

---

## Next Steps

### Recommended Enhancements

1. **Meal History**
   - Save favorite meals
   - Quick-add from history
   - Common food database

2. **Meal Photos**
   - Upload food image
   - AI visual recognition
   - Gemini Vision API

3. **Barcode Scanner**
   - Scan packaged foods
   - Instant macro lookup
   - Product database

4. **Recipe Builder**
   - Enter ingredients
   - Calculate total macros
   - Save custom recipes

5. **Macro Targets**
   - Adjust goals per meal
   - Meal timing (pre/post workout)
   - Carb cycling support

---

## Success Tips

### Week 1: Learn the System
- Experiment with descriptions
- Compare AI results with labels
- Build confidence

### Week 2-3: Build Habits
- Log all meals
- Review macro balance
- Adjust portions

### Week 4+: Optimize
- Hit macro targets consistently
- Plan meals in advance
- See body composition changes

---

## Support

### Getting Help

**Issues:**
1. Check API key is configured
2. Review example descriptions
3. Check browser console for errors

**Questions:**
- Refer to this guide
- Test with simple foods first
- Gradually increase complexity

---

## 🎉 You're All Set!

Your fitness tracker now has:
- ✅ AI-powered nutrition analysis
- ✅ Detailed macro tracking
- ✅ Clean, emoji-free UI
- ✅ Automatic calorie calculation
- ✅ Real-time progress tracking

**Start tracking your nutrition with AI today!** 🚀

---

**Version:** 2.0.0
**Updated:** January 1, 2026
**Powered by:** Google Gemini AI
