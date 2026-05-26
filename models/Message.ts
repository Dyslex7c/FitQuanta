import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessageDocument extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: 'client' | 'trainer';
  content: string;
  type: 'text' | 'image' | 'file' | 'system' | 'phone_request' | 'phone_response';
  fileUrl: string;
  fileName: string;
  seen: boolean;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    senderId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole:     { type: String, enum: ['client','trainer'], required: true },
    content:        { type: String, maxlength: 5000, default: '' },
    type:           { type: String, enum: ['text','image','file','system','phone_request','phone_response'], default: 'text' },
    fileUrl:        { type: String, default: '' },
    fileName:       { type: String, default: '' },
    seen:           { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });

const Message: Model<IMessageDocument> =
  mongoose.models.Message ?? mongoose.model<IMessageDocument>('Message', MessageSchema);

export default Message;
