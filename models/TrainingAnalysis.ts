import mongoose, { Schema, Document, Model } from 'mongoose';

const MuscleRecoverySchema = new Schema({
  muscle:          { type: String, required: true },
  lastTrainedAt:   { type: Date },
  setsLogged:      { type: Number, default: 0 },
  recoveryPercent: { type: Number, default: 100, min: 0, max: 100 },
  needsRest:       { type: Boolean, default: false },
}, { _id: false });

const DailyFatigueSchema = new Schema({
  date:         { type: String, required: true },
  fatigueScore: { type: Number, default: 0, min: 0, max: 100 },
  status:       { type: String, enum: ['optimal','undertraining','slight_undertraining','overtraining'], default: 'optimal' },
}, { _id: false });

export interface ITrainingAnalysisDocument extends Document {
  userId: mongoose.Types.ObjectId;
  analyzedAt: Date;
  weekStartDate: Date;
  trainingStatus: string;
  trainingScore: number;
  recoveryScore: number;
  fatigueLevel: string;
  weeklyIntensityScore: number;
  weeklyVolume: number;
  weeklyFrequency: number;
  avgSleepHours: number;
  avgCalories: number;
  cardioLoadMinutes: number;
  consecutiveTrainingDays: number;
  muscleRecovery: typeof MuscleRecoverySchema[];
  aiInsights: string[];
  dailyFatigue: typeof DailyFatigueSchema[];
}

const TrainingAnalysisSchema = new Schema<ITrainingAnalysisDocument>(
  {
    userId:                  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    analyzedAt:              { type: Date, default: Date.now },
    weekStartDate:           { type: Date, required: true },
    trainingStatus:          { type: String, enum: ['optimal','undertraining','slight_undertraining','overtraining'], default: 'optimal' },
    trainingScore:           { type: Number, default: 0, min: 0, max: 100 },
    recoveryScore:           { type: Number, default: 100, min: 0, max: 100 },
    fatigueLevel:            { type: String, enum: ['low','moderate','high','critical'], default: 'low' },
    weeklyIntensityScore:    { type: Number, default: 0, min: 0, max: 100 },
    weeklyVolume:            { type: Number, default: 0 },
    weeklyFrequency:         { type: Number, default: 0 },
    avgSleepHours:           { type: Number, default: 0 },
    avgCalories:             { type: Number, default: 0 },
    cardioLoadMinutes:       { type: Number, default: 0 },
    consecutiveTrainingDays: { type: Number, default: 0 },
    muscleRecovery:          { type: [MuscleRecoverySchema], default: [] },
    aiInsights:              { type: [String], default: [] },
    dailyFatigue:            { type: [DailyFatigueSchema], default: [] },
  },
  { timestamps: true }
);

/* One analysis record per user per week */
TrainingAnalysisSchema.index({ userId: 1, weekStartDate: -1 });

const TrainingAnalysis: Model<ITrainingAnalysisDocument> =
  mongoose.models.TrainingAnalysis ??
  mongoose.model<ITrainingAnalysisDocument>('TrainingAnalysis', TrainingAnalysisSchema);

export default TrainingAnalysis;
