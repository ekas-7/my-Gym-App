# Quick Setup - AI Diet Tracking

## 🚀 Get Started in 3 Steps

### Step 1: Get Gemini API Key (2 minutes)

1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key (starts with `AIzaSy...`)

### Step 2: Add to Environment (1 minute)

Open `frontend/.env.local` and update:

```bash
GEMINI_API_KEY=AIzaSy...your-actual-key-here
```

### Step 3: Restart Server (30 seconds)

```bash
cd frontend
npm run dev
```

## ✅ Test It Works

1. Open http://localhost:3000
2. Go to "Diet" tab
3. Type: **"2 eggs and toast"**
4. Click "Add Food"
5. See calories + macros appear!

---

## 🎯 Quick Examples

### Breakfast
```
2 scrambled eggs, whole wheat toast, banana, coffee
```

### Lunch
```
Grilled chicken salad with olive oil dressing
```

### Dinner
```
200g salmon, brown rice, broccoli
```

### Snack
```
Protein shake with peanut butter
```

---

## 📊 What You'll See

After adding food:

**Macro Cards Display:**
- Calories: 450 / 2,300 kcal
- Carbs: 45.2g / 250g
- Fats: 18.5g / 65g
- Protein: 28.3g / 190g

**Each with progress bar!**

---

## 💡 Pro Tips

1. **Be specific**: "150g chicken" not just "chicken"
2. **Include cooking method**: "Grilled" vs "Fried"
3. **Log immediately**: While you remember
4. **Check totals**: Review macro balance daily

---

## 🐛 Troubleshooting

**"Gemini API key not configured"**
- Double-check `.env.local` has your key
- Restart dev server

**"Failed to analyze"**
- Make description more specific
- Try simpler foods first
- Check internet connection

**Inaccurate results?**
- Add portion sizes: "1 cup", "200g"
- Include all ingredients
- Mention cooking method

---

## 🎉 You're Ready!

Now you can:
- Describe food in plain English
- Get automatic macro calculation
- Track nutrition with AI precision
- Hit your fitness goals faster!

**Go to the Diet tab and try it!** 🚀

---

## 📖 Full Documentation

For complete guide, see: `AI_DIET_GUIDE.md`
