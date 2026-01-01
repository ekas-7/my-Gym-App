import mongoose, { Schema, Model } from 'mongoose';

export interface IUserProfile {
  _id?: string;
  // Body Composition
  currentWeight: number;
  targetWeight: number;
  bodyFatPercentage: number;
  skeletalMuscle: number; // in kg
  visceralFatIndex: number;
  
  // Goals & Metabolism
  bmr: number; // Basal Metabolic Rate
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  goalType: 'cut' | 'bulk' | 'maintain';
  weeklyWeightChangeGoal: number; // kg per week (negative for cutting)
  
  // Calculated Targets
  dailyCalorieTarget: number;
  dailyProteinTarget: number; // in grams
  
  // Preferences
  waterGoal: number; // liters
  exerciseGoal: number; // minutes
  
  createdAt?: Date;
  updatedAt?: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    currentWeight: {
      type: Number,
      required: true,
      min: 0,
    },
    targetWeight: {
      type: Number,
      required: true,
      min: 0,
    },
    bodyFatPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    skeletalMuscle: {
      type: Number,
      required: true,
      min: 0,
    },
    visceralFatIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    bmr: {
      type: Number,
      required: true,
      min: 0,
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very-active'],
      required: true,
      default: 'moderate',
    },
    goalType: {
      type: String,
      enum: ['cut', 'bulk', 'maintain'],
      required: true,
      default: 'maintain',
    },
    weeklyWeightChangeGoal: {
      type: Number,
      required: true,
      default: 0,
    },
    dailyCalorieTarget: {
      type: Number,
      required: true,
      min: 0,
    },
    dailyProteinTarget: {
      type: Number,
      required: true,
      min: 0,
    },
    waterGoal: {
      type: Number,
      required: true,
      default: 4,
    },
    exerciseGoal: {
      type: Number,
      required: true,
      default: 60,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate TDEE (Total Daily Energy Expenditure)
export function calculateTDEE(bmr: number, activityLevel: string): number {
  const activityMultipliers: Record<string, number> = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very-active': 1.9,
  };
  
  return Math.round(bmr * (activityMultipliers[activityLevel] || 1.55));
}

// Calculate calorie target based on goal
export function calculateCalorieTarget(bmr: number, activityLevel: string, weeklyWeightChangeGoal: number): number {
  const tdee = calculateTDEE(bmr, activityLevel);
  
  // 1 kg fat = ~7700 calories
  const weeklyCalorieAdjustment = weeklyWeightChangeGoal * 7700;
  const dailyAdjustment = Math.round(weeklyCalorieAdjustment / 7);
  
  return tdee + dailyAdjustment;
}

const UserProfile: Model<IUserProfile> =
  mongoose.models.UserProfile || mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);

export default UserProfile;
