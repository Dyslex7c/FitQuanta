import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['client', 'trainer']).optional(),
  turnstileToken: z.string().min(1, 'CAPTCHA verification is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
