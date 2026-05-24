import { z } from 'zod';

const exerciseEntrySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  sets: z.number().int().min(1).max(100),
  reps: z.number().int().min(1).max(1000),
  weight: z.number().min(0).max(2000),
});

const cardioEntrySchema = z.object({
  activity: z.string().min(1).max(100).trim(),
  durationMinutes: z.number().int().min(1).max(600),
});

export const progressLogSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  type: z.enum(['workout', 'nutrition', 'health']),
  // Workout fields
  exercises: z.array(exerciseEntrySchema).max(50).optional(),
  // Nutrition fields
  calories: z.number().min(0).max(20000).optional(),
  protein: z.number().min(0).max(1000).optional(),
  carbs: z.number().min(0).max(2000).optional(),
  fats: z.number().min(0).max(1000).optional(),
  // Health fields
  sleepHours: z.number().min(0).max(24).optional(),
  steps: z.number().int().min(0).max(100000).optional(),
  cardio: z.array(cardioEntrySchema).max(20).optional(),
  // Common
  bodyWeight: z.number().min(20).max(500).optional(),
  notes: z.string().max(500).optional(),
});

export type ProgressLogInput = z.infer<typeof progressLogSchema>;
