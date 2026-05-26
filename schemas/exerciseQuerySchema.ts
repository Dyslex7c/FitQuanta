import { z } from 'zod';

export const exerciseQuerySchema = z.object({
  search:      z.string().max(100).optional().default(''),
  muscleGroup: z.enum(['','chest','back','shoulders','biceps','triceps','forearms',
                        'core','quadriceps','hamstrings','glutes','calves','full_body'])
                .optional().default(''),
  workoutType: z.enum(['','push','pull','legs','compound','isolation',
                        'cardio','hiit','flexibility','plyometric'])
                .optional().default(''),
  difficulty:  z.enum(['','beginner','intermediate','advanced'])
                .optional().default(''),
  equipment:   z.enum(['','none','barbell','dumbbell','machine','cable',
                        'resistance_band','kettlebell','bodyweight','pull_up_bar','bench'])
                .optional().default(''),
  page:        z.coerce.number().int().min(1).max(500).optional().default(1),
  limit:       z.coerce.number().int().min(1).max(50).optional().default(12),
});
