// ─── Fitness Log ─────────────────────────────────────────────────────────────

export interface IExerciseLog {
  category: 'cardio' | 'weight-training';
  subcategory?: 'chest' | 'back' | 'shoulders';
  name: string;
  reps?: number;
  sets?: number;
  duration?: number;
}

export interface IFitnessLog {
  id?: string;
  date: Date;
  waterLiters: number;
  waterGoal: number;
  calories: number;
  calorieGoal: number;
  carbs: number;
  carbsGoal: number;
  fats: number;
  fatsGoal: number;
  protein: number;
  proteinGoal: number;
  exerciseCalories: number;
  exerciseGoal: number;
  exercises: IExerciseLog[];
  weight?: number;
  bodyFatPercentage?: number;
  goalsCompleted: number;
  totalGoals: number;
  isStreakDay: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Meal ─────────────────────────────────────────────────────────────────────

export interface IMeal {
  id?: string;
  date: Date;
  timestamp: Date;
  description: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
  calories: number;
  carbs: number;
  fats: number;
  protein: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  notes?: string;
  isAIAnalyzed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Exercise ─────────────────────────────────────────────────────────────────

export interface ISet {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface IExercise {
  id?: string;
  date: Date;
  name: string;
  category: 'cardio' | 'weight-training';
  muscleGroup?: 'chest' | 'back' | 'shoulders' | 'legs' | 'arms' | 'core' | 'full-body';
  sets: ISet[];
  duration?: number;
  distance?: number;
  notes?: string;
  caloriesBurned?: number;
  isAIAnalyzed?: boolean;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface IUserProfile {
  id?: string;
  height: number;                 // cm — used for BMI & body-fat estimate
  age?: number;                   // years — used for body-fat estimate
  gender?: 'male' | 'female';     // used for body-fat estimate
  currentWeight: number;
  targetWeight: number;
  bodyFatPercentage: number;
  skeletalMuscle: number;
  visceralFatIndex: number;
  bmr: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  goalType: 'cut' | 'bulk' | 'maintain';
  weeklyWeightChangeGoal: number;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  waterGoal: number;
  exerciseGoal: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Weight Log ───────────────────────────────────────────────────────────────

export interface IWeightLog {
  id?: string;
  date: Date;
  weight: number;
  bodyFatPercentage?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Utility functions ────────────────────────────────────────────────────────

/** Body Mass Index = weight(kg) / height(m)² */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0;
  const h = heightCm / 100;
  return weightKg / (h * h);
}

/**
 * Estimate body-fat % from weight, height, age and gender using the
 * Deurenberg formula:  BF% = 1.20·BMI + 0.23·age − 10.8·sex − 5.4
 * where sex = 1 (male) / 0 (female). Falls back to age 30 / male when unknown.
 */
export function estimateBodyFat(
  weightKg: number,
  heightCm: number,
  age = 30,
  gender: 'male' | 'female' = 'male'
): number {
  const bmi = calculateBMI(weightKg, heightCm);
  if (!bmi) return 0;
  const sex = gender === 'male' ? 1 : 0;
  const bf = 1.2 * bmi + 0.23 * age - 10.8 * sex - 5.4;
  return Math.max(3, Math.round(bf * 10) / 10);
}


export function calculateTDEE(bmr: number, activityLevel: string): number {
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    'very-active': 1.9,
  };
  return Math.round(bmr * (activityMultipliers[activityLevel] || 1.55));
}

export function calculateCalorieTarget(
  bmr: number,
  activityLevel: string,
  weeklyWeightChangeGoal: number
): number {
  const tdee = calculateTDEE(bmr, activityLevel);
  const weeklyCalorieAdjustment = weeklyWeightChangeGoal * 7700;
  const dailyAdjustment = Math.round(weeklyCalorieAdjustment / 7);
  return tdee + dailyAdjustment;
}
