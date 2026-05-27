import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUploadDocument extends Document {
  filename: string;
  mimetype: string;
  data: string; // base64 encoded string
  createdAt: Date;
  updatedAt: Date;
}

const UploadSchema = new Schema<IUploadDocument>(
  {
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    data: { type: String, required: true },
  },
  { timestamps: true }
);

const Upload: Model<IUploadDocument> =
  mongoose.models.Upload ?? mongoose.model<IUploadDocument>('Upload', UploadSchema);

export default Upload;
