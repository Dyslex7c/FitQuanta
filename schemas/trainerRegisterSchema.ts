import { z } from 'zod';

export const trainerRegisterSchema = z.object({
  name:              z.string().min(2).max(100).trim(),
  email:             z.string().email().toLowerCase().trim(),
  password:          z.string().min(8).max(128)
                      .regex(/[0-9]/, 'Must contain a number')
                      .regex(/[^a-zA-Z0-9]/, 'Must contain a special character'),
  age:               z.number().int().min(18).max(80),
  gender:            z.enum(['male','female','other']),
  country:           z.string().min(2).max(100).trim(),
  location:          z.string().max(200).trim(),
  bio:               z.string().max(2000).trim(),
  certifications:    z.array(z.string().max(200).trim()).max(20),
  yearsOfExperience: z.number().int().min(0).max(60),
  clientsTrained:    z.number().int().min(0),
  specializations:   z.array(z.enum([
    'weight_loss','muscle_gain','strength','cardio',
    'yoga','hiit','rehabilitation','sports','nutrition'
  ])).min(1).max(9),
  turnstileToken:    z.string().min(1, 'CAPTCHA verification is required'),
});

export type TrainerRegisterInput = z.infer<typeof trainerRegisterSchema>;
