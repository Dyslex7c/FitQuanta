import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserAchievementDocument extends Document {
  userId: mongoose.Types.ObjectId;
  achievementId: mongoose.Types.ObjectId;
  unlockedAt: Date;
  seen: boolean;
}

const UserAchievementSchema = new Schema<IUserAchievementDocument>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: 'User',        required: true, index: true },
    achievementId: { type: Schema.Types.ObjectId, ref: 'Achievement', required: true },
    unlockedAt:    { type: Date, default: Date.now },
    seen:          { type: Boolean, default: false },
  },
  { timestamps: false }
);

/* Prevent duplicate unlocks */
UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

const UserAchievement: Model<IUserAchievementDocument> =
  mongoose.models.UserAchievement ??
  mongoose.model<IUserAchievementDocument>('UserAchievement', UserAchievementSchema);

export default UserAchievement;
