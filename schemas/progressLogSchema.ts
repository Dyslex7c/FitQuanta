import { z } from 'zod';

export const progressLogSchema = z.object({
  date: z.string().datetime(),
  type: z.enum(['workout', 'nutrition', 'health']),
  exercises: z.array(z.object({
    name: z.string().max(100),
    sets: z.number().int().min(1).max(100),
    reps: z.number().int().min(1).max(1000),
    weight: z.number().min(0).max(1000),
  })).optional(),
  calories: z.number().min(0).max(20000).optional(),
  protein: z.number().min(0).max(1000).optional(),
  carbs: z.number().min(0).max(2000).optional(),
  fats: z.number().min(0).max(1000).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  steps: z.number().int().min(0).max(100000).optional(),
  cardio: z.array(z.object({
    activity: z.string().max(100),
    durationMinutes: z.number().min(1).max(600),
  })).optional(),
  bodyWeight: z.number().min(20).max(500).optional(),
});

export type ProgressLogInput = z.infer<typeof progressLogSchema>;
