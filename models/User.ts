import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
  ActivityLevel, FitnessGoal, DietPreference,
  BudgetLevel, EquipmentLevel, FitnessLevel, BMICategory, UserRole
} from '@/types/user';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  country: string;
  activityLevel: ActivityLevel;
  fitnessLevel: FitnessLevel;
  fitnessGoal: FitnessGoal;
  dietPreference: DietPreference;
  budget: BudgetLevel;
  equipment: EquipmentLevel;
  foodAllergies: string[];
  medicalConditions: string[];
  injuries: string[];
  bmi?: number;
  bmiCategory?: BMICategory;
  onboardingComplete: boolean;
  favoriteExercises?: string[];
  activeTrainerId?: mongoose.Types.ObjectId | null;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'trainer', 'client'], default: 'client' },
    age: { type: Number, min: 13, max: 100 },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    height: { type: Number, min: 50, max: 300 },
    weight: { type: Number, min: 20, max: 500 },
    country: { type: String, trim: true, maxlength: 100 },
    activityLevel: { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'] },
    fitnessLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    fitnessGoal: { type: String, enum: ['fat_loss', 'muscle_gain', 'maintenance'] },
    dietPreference: { type: String, enum: ['veg', 'non-veg', 'vegan'] },
    budget: { type: String, enum: ['low', 'medium', 'high'] },
    equipment: { type: String, enum: ['none', 'home', 'gym'] },
    foodAllergies: { type: [String], default: [] },
    medicalConditions: { type: [String], default: [] },
    injuries: { type: [String], default: [] },
    bmi: { type: Number },
    bmiCategory: { type: String, enum: ['Underweight', 'Normal', 'Overweight', 'Obese'] },
    onboardingComplete: { type: Boolean, default: false },
    favoriteExercises: { type: [String], default: [] },
    activeTrainerId: { type: Schema.Types.ObjectId, ref: 'Trainer', default: null },
  },
  { timestamps: true }
);

const User: Model<IUserDocument> =
  mongoose.models.User ?? mongoose.model<IUserDocument>('User', UserSchema);

export default User;
