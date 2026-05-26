import mongoose, { Schema, Document, Model } from 'mongoose';

const DiscountCodeSchema = new Schema({
  code:            { type: String, required: true },
  discountPercent: { type: Number, required: true },
  used:            { type: Boolean, default: false },
  expiresAt:       { type: Date,   required: true },
}, { _id: false });

export interface IUserRewardDocument extends Document {
  userId: mongoose.Types.ObjectId;
  totalBadgesEarned: number;
  currentTierIndex: number;
  discountCodes: Array<{
    code: string;
    discountPercent: number;
    used: boolean;
    expiresAt: Date;
  }>;
}

const UserRewardSchema = new Schema<IUserRewardDocument>(
  {
    userId:           { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    totalBadgesEarned:{ type: Number, default: 0, min: 0 },
    currentTierIndex: { type: Number, default: -1 },
    discountCodes:    { type: [DiscountCodeSchema], default: [] },
  },
  { timestamps: true }
);

const UserReward: Model<IUserRewardDocument> =
  mongoose.models.UserReward ??
  mongoose.model<IUserRewardDocument>('UserReward', UserRewardSchema);

export default UserReward;
