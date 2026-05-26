import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChatDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  trainerId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  purchaseId: mongoose.Types.ObjectId;
  lastMessage: string;
  lastMessageAt: Date;
  clientUnread: number;
  trainerUnread: number;
  isActive: boolean;
}

const ChatSchema = new Schema<IChatDocument>(
  {
    clientId:      { type: Schema.Types.ObjectId, ref: 'User',    required: true, index: true },
    trainerId:     { type: Schema.Types.ObjectId, ref: 'Trainer', required: true, index: true },
    planId:        { type: Schema.Types.ObjectId, ref: 'TrainerPlan' },
    purchaseId:    { type: Schema.Types.ObjectId, ref: 'Purchase' },
    lastMessage:   { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    clientUnread:  { type: Number, default: 0 },
    trainerUnread: { type: Number, default: 0 },
    isActive:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

ChatSchema.index({ clientId: 1, trainerId: 1 }, { unique: true });

const Chat: Model<IChatDocument> =
  mongoose.models.Chat ?? mongoose.model<IChatDocument>('Chat', ChatSchema);

export default Chat;
