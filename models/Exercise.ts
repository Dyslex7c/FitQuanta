import mongoose, { Schema, Document, Model } from 'mongoose';
import type { MuscleGroup, WorkoutType, DifficultyLevel, EquipmentType } from '@/types/exercise';

export interface IExerciseDocument extends Document {
  name: string;
  slug: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType;
  workoutType: WorkoutType;
  difficulty: DifficultyLevel;
  youtubeVideoId: string;
  youtubeThumbnail: string;
  youtubeCachedAt: Date | null;
  instructions: string[];
  commonMistakes: string[];
  safetyNotes: string[];
  recommendedSets: string;
  recommendedReps: string;
  caloriesBurnedEstimate: number;
}

const ExerciseSchema = new Schema<IExerciseDocument>(
  {
    name: {
      type: String, required: true, trim: true, maxlength: 150,
    },
    slug: {
      type: String, required: true, unique: true, lowercase: true, trim: true,
      index: true,
    },
    muscleGroup: {
      type: String,
      enum: ['chest','back','shoulders','biceps','triceps','forearms',
             'core','quadriceps','hamstrings','glutes','calves','full_body'],
      required: true, index: true,
    },
    secondaryMuscles: {
      type: [String],
      enum: ['chest','back','shoulders','biceps','triceps','forearms',
             'core','quadriceps','hamstrings','glutes','calves','full_body'],
      default: [],
    },
    equipment: {
      type: String,
      enum: ['none','barbell','dumbbell','machine','cable',
             'resistance_band','kettlebell','bodyweight','pull_up_bar','bench'],
      required: true, index: true,
    },
    workoutType: {
      type: String,
      enum: ['push','pull','legs','compound','isolation',
             'cardio','hiit','flexibility','plyometric'],
      required: true, index: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner','intermediate','advanced'],
      required: true, index: true,
    },
    /* YouTube cache — stored after first fetch so we don't hit API on every view */
    youtubeVideoId:    { type: String, default: '' },
    youtubeThumbnail:  { type: String, default: '' },
    youtubeCachedAt:   { type: Date, default: null },
    instructions:    { type: [String], default: [] },
    commonMistakes:  { type: [String], default: [] },
    safetyNotes:     { type: [String], default: [] },
    recommendedSets: { type: String, default: '3-4' },
    recommendedReps: { type: String, default: '8-12' },
    caloriesBurnedEstimate: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

/* Text index for full-text search on name */
ExerciseSchema.index({ name: 'text' });

/* Compound index for common filter combinations */
ExerciseSchema.index({ muscleGroup: 1, difficulty: 1 });
ExerciseSchema.index({ workoutType: 1, equipment: 1 });

const Exercise: Model<IExerciseDocument> =
  mongoose.models.Exercise ??
  mongoose.model<IExerciseDocument>('Exercise', ExerciseSchema);

export default Exercise;
