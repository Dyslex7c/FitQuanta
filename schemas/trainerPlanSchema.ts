import { z } from 'zod';

export const trainerPlanSchema = z.object({
  name:            z.string().min(2).max(150).trim(),
  durationWeeks:   z.number().int().min(1).max(52),
  priceINR:        z.number().min(0).max(1000000),
  features:        z.array(z.string().max(200).trim()).max(20),
  includesDiet:    z.boolean(),
  includesWorkout: z.boolean(),
  includesChat:    z.boolean(),
});

export type TrainerPlanInput = z.infer<typeof trainerPlanSchema>;
