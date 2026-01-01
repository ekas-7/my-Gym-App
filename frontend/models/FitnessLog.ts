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
  exerciseMinutes: number;
  exerciseGoal: number;
  exercises: IExerciseLog[];
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
