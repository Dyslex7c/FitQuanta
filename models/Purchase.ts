import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPurchaseDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  trainerId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  planName: string;
  amountINR: number;
  platformCommissionINR: number;
  trainerEarningsINR: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
}

const PurchaseSchema = new Schema<IPurchaseDocument>(
  {
    clientId:              { type: Schema.Types.ObjectId, ref: 'User',        required: true, index: true },
    trainerId:             { type: Schema.Types.ObjectId, ref: 'Trainer',     required: true, index: true },
    planId:                { type: Schema.Types.ObjectId, ref: 'TrainerPlan', required: true },
    planName:              { type: String, required: true },
    amountINR:             { type: Number, required: true, min: 0 },
    platformCommissionINR: { type: Number, required: true, min: 0 },
    trainerEarningsINR:    { type: Number, required: true, min: 0 },
    razorpayOrderId:       { type: String, required: true, unique: true },
    razorpayPaymentId:     { type: String, default: '' },
    razorpaySignature:     { type: String, default: '' },
    status:                { type: String, enum: ['pending','completed','refunded','failed'], default: 'pending', index: true },
  },
  { timestamps: true }
);

const Purchase: Model<IPurchaseDocument> =
  mongoose.models.Purchase ?? mongoose.model<IPurchaseDocument>('Purchase', PurchaseSchema);

export default Purchase;
