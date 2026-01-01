import mongoose, { Schema, Model } from 'mongoose';

export interface IFitnessLog {
  _id?: string;
  date: Date;
  waterLiters: number;
  waterGoal: number;
  calories: number;
  calorieGoal: number;
  exerciseMinutes: number;
  exerciseGoal: number;
  createdAt?: Date;
  updatedAt?: Date;
}

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
      default: 2.5, // 2.5 liters per day
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
