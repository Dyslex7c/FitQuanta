import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IExerciseEntry, ICardioEntry } from '@/types/progress';

export interface IProgressLogDocument extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  type: 'workout' | 'nutrition' | 'health';
  exercises?: IExerciseEntry[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  sleepHours?: number;
  steps?: number;
  cardio?: ICardioEntry[];
  bodyWeight?: number;
}

const ProgressLogSchema = new Schema<IProgressLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ['workout', 'nutrition', 'health'], required: true },
    exercises: [{ name: String, sets: Number, reps: Number, weight: Number }],
    calories: { type: Number, min: 0 },
    protein: { type: Number, min: 0 },
    carbs: { type: Number, min: 0 },
    fats: { type: Number, min: 0 },
    sleepHours: { type: Number, min: 0, max: 24 },
    steps: { type: Number, min: 0 },
    cardio: [{ activity: String, durationMinutes: Number }],
    bodyWeight: { type: Number, min: 20, max: 500 },
  },
  { timestamps: true }
);

const ProgressLog: Model<IProgressLogDocument> =
  mongoose.models.ProgressLog ??
  mongoose.model<IProgressLogDocument>('ProgressLog', ProgressLogSchema);

export default ProgressLog;
