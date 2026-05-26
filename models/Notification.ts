import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'chat' | 'purchase' | 'approval' | 'review' | 'phone_request' | 'system';
  title: string;
  message: string;
  link: string;
  read: boolean;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type:    { type: String, enum: ['chat','purchase','approval','review','phone_request','system'], required: true },
    title:   { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 500 },
    link:    { type: String, default: '' },
    read:    { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

const Notification: Model<INotificationDocument> =
  mongoose.models.Notification ?? mongoose.model<INotificationDocument>('Notification', NotificationSchema);

export default Notification;
