import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITrainerPlanDocument extends Document {
  trainerId: mongoose.Types.ObjectId;
  name: string;
  durationWeeks: number;
  priceINR: number;
  features: string[];
  includesDiet: boolean;
  includesWorkout: boolean;
  includesChat: boolean;
  isActive: boolean;
}

const TrainerPlanSchema = new Schema<ITrainerPlanDocument>(
  {
    trainerId:       { type: Schema.Types.ObjectId, ref: 'Trainer', required: true, index: true },
    name:            { type: String, required: true, trim: true, maxlength: 150 },
    durationWeeks:   { type: Number, required: true, min: 1, max: 52 },
    priceINR:        { type: Number, required: true, min: 0 },
    features:        { type: [String], default: [] },
    includesDiet:    { type: Boolean, default: false },
    includesWorkout: { type: Boolean, default: true },
    includesChat:    { type: Boolean, default: false },
    isActive:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

const TrainerPlan: Model<ITrainerPlanDocument> =
  mongoose.models.TrainerPlan ?? mongoose.model<ITrainerPlanDocument>('TrainerPlan', TrainerPlanSchema);

export default TrainerPlan;
