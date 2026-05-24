import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(64, 'JWT_SECRET must be at least 64 characters long'),
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Environment variable validation failed');
}

export const env = parsed.data;
