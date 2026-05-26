import { z } from 'zod';

export const triggerCheckSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export type TriggerCheckInput = z.infer<typeof triggerCheckSchema>;
