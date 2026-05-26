import { z } from 'zod';

export const trainingThresholdsSchema = z.object({
  weeklyVolume: z.object({
    under: z.number().int().min(0),
    optimal: z.array(z.number().int().min(0)).length(2),
    over: z.number().int().min(0),
  }),
  weeklyFrequency: z.object({
    under: z.number().int().min(0),
    optimal: z.array(z.number().int().min(0)).length(2),
    over: z.number().int().min(0),
  }),
  consecutiveDays: z.object({
    overLimit: z.number().int().min(0),
  }),
  sleepHours: z.object({
    poor: z.number().min(0),
    good: z.number().min(0),
  }),
  calories: z.object({
    low: z.number().min(0),
    high: z.number().min(0),
  }),
  cardioMinutes: z.object({
    over: z.number().min(0),
  }),
  setsPerMuscle: z.object({
    over: z.number().int().min(0),
  }),
  recoveryHours: z.object({
    minimum: z.number().min(0),
  }),
});

export const manualCheckSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-C]{24}$/i, 'Invalid user ID format'),
});
