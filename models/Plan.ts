import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IWorkoutDay, IDietDay } from '@/types/plan';

export interface IPlanDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'ai_free' | 'trainer';
  workoutPlan: IWorkoutDay[];
  dietPlan: IDietDay[];
}

const PlanSchema = new Schema<IPlanDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['ai_free', 'trainer'], required: true },
    workoutPlan: { type: Schema.Types.Mixed, required: true },
    dietPlan: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

const Plan: Model<IPlanDocument> =
  mongoose.models.Plan ?? mongoose.model<IPlanDocument>('Plan', PlanSchema);

export default Plan;
