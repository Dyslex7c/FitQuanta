import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITrainerDocument extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  country: string;
  location: string;
  bio: string;
  certifications: string[];
  yearsOfExperience: number;
  clientsTrained: number;
  specializations: string[];
  profilePhotoUrl: string;
  availabilityStatus: 'available' | 'busy' | 'unavailable';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  averageRating: number;
  totalReviews: number;
  adminNote: string;
}

const TrainerSchema = new Schema<ITrainerDocument>(
  {
    userId:            { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    name:              { type: String, required: true, trim: true, maxlength: 100 },
    age:               { type: Number, min: 18, max: 80 },
    gender:            { type: String, enum: ['male','female','other'] },
    country:           { type: String, trim: true, maxlength: 100, index: true },
    location:          { type: String, trim: true, maxlength: 200 },
    bio:               { type: String, maxlength: 2000, default: '' },
    certifications:    { type: [String], default: [] },
    yearsOfExperience: { type: Number, min: 0, max: 60, default: 0, index: true },
    clientsTrained:    { type: Number, min: 0, default: 0 },
    specializations:   {
      type: [String],
      enum: ['weight_loss','muscle_gain','strength','cardio','yoga','hiit','rehabilitation','sports','nutrition'],
      default: [],
      index: true,
    },
    profilePhotoUrl:   { type: String, default: '' },
    availabilityStatus:{ type: String, enum: ['available','busy','unavailable'], default: 'available', index: true },
    status:            { type: String, enum: ['pending','approved','rejected','suspended'], default: 'pending', index: true },
    averageRating:     { type: Number, default: 0, min: 0, max: 5 },
    totalReviews:      { type: Number, default: 0, min: 0 },
    adminNote:         { type: String, default: '' },
  },
  { timestamps: true }
);

TrainerSchema.index({ name: 'text', bio: 'text' });
TrainerSchema.index({ status: 1, availabilityStatus: 1 });

const Trainer: Model<ITrainerDocument> =
  mongoose.models.Trainer ?? mongoose.model<ITrainerDocument>('Trainer', TrainerSchema);

export default Trainer;
