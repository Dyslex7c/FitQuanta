import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAchievementDocument extends Document {
  key: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  icon: string;
  colorHex: string;
  condition: { type: string; threshold: number };
  sortOrder: number;
}

const AchievementSchema = new Schema<IAchievementDocument>(
  {
    key:         { type: String, required: true, unique: true, trim: true },
    name:        { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 300 },
    category:    {
      type: String,
      enum: ['consistency','strength','weight_loss','muscle_gain',
             'streaks','nutrition','sleep','steps','cardio','engagement'],
      required: true,
    },
    rarity:  { type: String, enum: ['common','rare','epic','legendary'], default: 'common' },
    icon:    { type: String, required: true, maxlength: 10 },
    colorHex:{ type: String, required: true, maxlength: 10 },
    condition: {
      type:      { type: String, required: true },
      threshold: { type: Number, required: true, min: 1 },
    },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: false }
);

const Achievement: Model<IAchievementDocument> =
  mongoose.models.Achievement ??
  mongoose.model<IAchievementDocument>('Achievement', AchievementSchema);

export default Achievement;
