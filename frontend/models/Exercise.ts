import mongoose, { Schema, Model } from 'mongoose';

// Interface for a single set
export interface ISet {
  setNumber: number;
  weight: number; // Weight in kg
  reps: number; // Number of repetitions
  completed: boolean; // Whether this set was completed
}

// Main exercise log interface
export interface IExercise {
  _id?: string;
  userId?: string; // For future multi-user support
  date: Date;
  name: string; // Exercise name (e.g., "Bench Press", "Squats")
  category: 'cardio' | 'weight-training';
  muscleGroup?: 'chest' | 'back' | 'shoulders' | 'legs' | 'arms' | 'core' | 'full-body';
  sets: ISet[]; // Array of sets with weight and reps
  duration?: number; // Duration in minutes (for cardio)
  distance?: number; // Distance in km (for running/cycling)
  notes?: string; // User notes about the exercise
  caloriesBurned?: number; // Estimated calories burned
  createdAt?: Date;
  updatedAt?: Date;
}

// Schema for a single set
const SetSchema = new Schema<ISet>({
  setNumber: {
    type: Number,
    required: true,
    min: 1,
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  reps: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  completed: {
    type: Boolean,
    default: true,
  },
});

// Main exercise schema
const ExerciseSchema = new Schema<IExercise>(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['cardio', 'weight-training'],
      required: true,
    },
    muscleGroup: {
      type: String,
      enum: ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'full-body'],
    },
    sets: {
      type: [SetSchema],
      default: [],
    },
    duration: {
      type: Number,
      min: 0,
    },
    distance: {
      type: Number,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    caloriesBurned: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
  }
);

// Compound index for efficient queries by user and date
ExerciseSchema.index({ userId: 1, date: -1 });

// Virtual for total volume (weight × reps across all sets)
ExerciseSchema.virtual('totalVolume').get(function () {
  return this.sets.reduce((total, set) => {
    return total + (set.weight * set.reps);
  }, 0);
});

// Virtual for total reps
ExerciseSchema.virtual('totalReps').get(function () {
  return this.sets.reduce((total, set) => total + set.reps, 0);
});

// Method to calculate personal record (PR)
ExerciseSchema.methods.getMaxWeight = function () {
  if (this.sets.length === 0) return 0;
  return Math.max(...this.sets.map((set: ISet) => set.weight));
};

// Method to calculate average weight across sets
ExerciseSchema.methods.getAverageWeight = function () {
  if (this.sets.length === 0) return 0;
  const total = this.sets.reduce((sum: number, set: ISet) => sum + set.weight, 0);
  return total / this.sets.length;
};

// Prevent model recompilation in development
const Exercise: Model<IExercise> = 
  mongoose.models.Exercise || mongoose.model<IExercise>('Exercise', ExerciseSchema);

export default Exercise;
