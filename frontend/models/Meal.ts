import mongoose, { Schema, Model } from 'mongoose';

// Main meal log interface
export interface IMeal {
  _id?: string;
  userId?: string; // For future multi-user support
  date: Date; // Date of the meal
  timestamp: Date; // Exact time the meal was logged
  description: string; // User's description of the meal (used for AI analysis)
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
  // Macronutrients
  calories: number;
  carbs: number; // Carbohydrates in grams
  fats: number; // Fats in grams
  protein: number; // Protein in grams
  // Optional detailed nutrients
  fiber?: number; // Fiber in grams
  sugar?: number; // Sugar in grams
  sodium?: number; // Sodium in mg
  // Metadata
  notes?: string; // Additional user notes
  isAIAnalyzed: boolean; // Whether this was analyzed by AI or manually entered
  createdAt?: Date;
  updatedAt?: Date;
}

// Meal schema
const MealSchema = new Schema<IMeal>(
  {
    userId: {
      type: String,
      index: true, // Index for faster user-specific queries
    },
    date: {
      type: Date,
      required: true,
      index: true, // Index for date-based queries
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack', 'other'],
      required: true,
      default: 'other',
    },
    calories: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    carbs: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    fats: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    protein: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    fiber: {
      type: Number,
      min: 0,
    },
    sugar: {
      type: Number,
      min: 0,
    },
    sodium: {
      type: Number,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    isAIAnalyzed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
  }
);

// Compound index for efficient queries by user and date
MealSchema.index({ userId: 1, date: -1 });
MealSchema.index({ userId: 1, timestamp: -1 });

// Virtual for total macros in calories
MealSchema.virtual('macroCalories').get(function () {
  // Carbs: 4 cal/g, Protein: 4 cal/g, Fats: 9 cal/g
  return (this.carbs * 4) + (this.protein * 4) + (this.fats * 9);
});

// Virtual for carb percentage
MealSchema.virtual('carbPercentage').get(function () {
  const total = (this.carbs * 4) + (this.protein * 4) + (this.fats * 9);
  if (total === 0) return 0;
  return Math.round((this.carbs * 4 / total) * 100);
});

// Virtual for protein percentage
MealSchema.virtual('proteinPercentage').get(function () {
  const total = (this.carbs * 4) + (this.protein * 4) + (this.fats * 9);
  if (total === 0) return 0;
  return Math.round((this.protein * 4 / total) * 100);
});

// Virtual for fat percentage
MealSchema.virtual('fatPercentage').get(function () {
  const total = (this.carbs * 4) + (this.protein * 4) + (this.fats * 9);
  if (total === 0) return 0;
  return Math.round((this.fats * 9 / total) * 100);
});

// Static method to get daily totals
MealSchema.statics.getDailyTotals = async function (date: Date, userId?: string) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const query: any = {
    date: { $gte: startOfDay, $lte: endOfDay },
  };
  
  if (userId) {
    query.userId = userId;
  }

  const meals = await this.find(query);
  
  return {
    totalCalories: meals.reduce((sum: number, meal: any) => sum + meal.calories, 0),
    totalCarbs: meals.reduce((sum: number, meal: any) => sum + meal.carbs, 0),
    totalFats: meals.reduce((sum: number, meal: any) => sum + meal.fats, 0),
    totalProtein: meals.reduce((sum: number, meal: any) => sum + meal.protein, 0),
    mealCount: meals.length,
    meals,
  };
};

// Static method to get meals by type for a date
MealSchema.statics.getMealsByType = async function (
  date: Date,
  mealType: string,
  userId?: string
) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const query: any = {
    date: { $gte: startOfDay, $lte: endOfDay },
    mealType,
  };
  
  if (userId) {
    query.userId = userId;
  }

  return await this.find(query).sort({ timestamp: 1 });
};

// Prevent model recompilation in development
const Meal: Model<IMeal> = 
  mongoose.models.Meal || mongoose.model<IMeal>('Meal', MealSchema);

export default Meal;
