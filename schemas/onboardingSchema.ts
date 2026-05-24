import { z } from 'zod';

export const onboardingSchema = z.object({
  age: z.number().int().min(13).max(100),
  gender: z.enum(['male', 'female', 'other']),
  height: z.number().min(50).max(300),
  weight: z.number().min(20).max(500),
  country: z.string().min(2).max(100).trim(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  fitnessGoal: z.enum(['fat_loss', 'muscle_gain', 'maintenance']),
  dietPreference: z.enum(['veg', 'non-veg', 'vegan']),
  budget: z.enum(['low', 'medium', 'high']),
  equipment: z.enum(['none', 'home', 'gym']),
  foodAllergies: z.array(z.string().max(50)).max(20).default([]),
  medicalConditions: z.array(z.string().max(100)).max(20).default([]),
  injuries: z.array(z.string().max(100)).max(20).default([]),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
