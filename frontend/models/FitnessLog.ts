import mongoose, { Schema, Model } from 'mongoose';

export interface IExerciseLog {
  category: 'cardio' | 'weight-training';
  subcategory?: 'chest' | 'back' | 'shoulders';
  name: string;
  reps?: number;
  sets?: number;
  duration?: number; // for cardio in minutes
}

export interface IFitnessLog {
  _id?: string;
  date: Date;
  waterLiters: number;
  waterGoal: number;
  calories: number;
  calorieGoal: number;
  // Macronutrients
  carbs: number; // Carbohydrates in grams
  carbsGoal: number; // Target carbs
  fats: number; // Fats in grams
  fatsGoal: number; // Target fats
  protein: number; // Protein in grams
  proteinGoal: number; // Target protein (from user profile)
  exerciseMinutes: number;
  exerciseGoal: number;
  exercises: IExerciseLog[];
  // Weight tracking
  weight?: number; // Current weight in kg
  bodyFatPercentage?: number; // Body fat %
  // Streak tracking
  goalsCompleted: number; // How many goals were met (0-4)
  totalGoals: number; // Total trackable goals (always 4: water, calories, exercise, weight)
  isStreakDay: boolean; // True if all goals were met
  createdAt?: Date;
  updatedAt?: Date;
}

const ExerciseLogSchema = new Schema<IExerciseLog>({
  category: {
    type: String,
    enum: ['cardio', 'weight-training'],
    required: true,
  },
  subcategory: {
    type: String,
    enum: ['chest', 'back', 'shoulders'],
  },
  name: {
    type: String,
    required: true,
  },
  reps: {
    type: Number,
    min: 0,
  },
  sets: {
    type: Number,
    min: 0,
  },
  duration: {
    type: Number,
    min: 0,
  },
});

const FitnessLogSchema = new Schema<IFitnessLog>(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    waterLiters: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    waterGoal: {
      type: Number,
      required: true,
      default: 4, // 4 liters per day
    },
    calories: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    calorieGoal: {
      type: Number,
      required: true,
      default: 2000,
    },
    carbs: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    carbsGoal: {
      type: Number,
      required: true,
      default: 250, // grams per day
    },
    fats: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    fatsGoal: {
      type: Number,
      required: true,
      default: 65, // grams per day
    },
    protein: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    proteinGoal: {
      type: Number,
      required: true,
      default: 190, // grams per day
    },
    exerciseMinutes: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    exerciseGoal: {
      type: Number,
      required: true,
      default: 60,
    },
    exercises: {
      type: [ExerciseLogSchema],
      default: [],
    },
    weight: {
      type: Number,
      min: 0,
    },
    bodyFatPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    goalsCompleted: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 4,
    },
    totalGoals: {
      type: Number,
      required: true,
      default: 4, // water, calories, exercise, weight
    },
    isStreakDay: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index on date for efficient querying
FitnessLogSchema.index({ date: -1 });

const FitnessLog: Model<IFitnessLog> =
  mongoose.models.FitnessLog || mongoose.model<IFitnessLog>('FitnessLog', FitnessLogSchema);

export default FitnessLog;
