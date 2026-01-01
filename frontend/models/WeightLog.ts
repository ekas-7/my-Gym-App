import mongoose from 'mongoose';

export interface IWeightLog {
  date: Date;
  weight: number;
  bodyFatPercentage?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const WeightLogSchema = new mongoose.Schema<IWeightLog>(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    bodyFatPercentage: {
      type: Number,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create index on date for faster queries
WeightLogSchema.index({ date: -1 });

export const WeightLog = mongoose.models.WeightLog || mongoose.model<IWeightLog>('WeightLog', WeightLogSchema);
