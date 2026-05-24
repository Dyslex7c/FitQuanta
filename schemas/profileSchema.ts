import { z } from 'zod';
import { onboardingSchema } from './onboardingSchema';

export const profileSchema = onboardingSchema.extend({
  name: z.string().min(2).max(100).trim(),
  onboardingComplete: z.boolean(),
}).partial();

export type ProfileInput = z.infer<typeof profileSchema>;
