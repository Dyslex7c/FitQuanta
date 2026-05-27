import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReportDocument extends Document {
  htmlContent: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReportDocument>(
  {
    htmlContent: { type: String, required: true },
  },
  { timestamps: true }
);

const Report: Model<IReportDocument> =
  mongoose.models.Report ?? mongoose.model<IReportDocument>('Report', ReportSchema);

export default Report;
