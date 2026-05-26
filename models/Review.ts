import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReviewDocument extends Document {
  trainerId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  purchaseId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
}

const ReviewSchema = new Schema<IReviewDocument>(
  {
    trainerId:  { type: Schema.Types.ObjectId, ref: 'Trainer',  required: true, index: true },
    clientId:   { type: Schema.Types.ObjectId, ref: 'User',     required: true },
    purchaseId: { type: Schema.Types.ObjectId, ref: 'Purchase', required: true, unique: true },
    rating:     { type: Number, required: true, min: 1, max: 5 },
    comment:    { type: String, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

const Review: Model<IReviewDocument> =
  mongoose.models.Review ?? mongoose.model<IReviewDocument>('Review', ReviewSchema);

export default Review;
