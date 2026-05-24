import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string(),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters long'),
  GROQ_API_KEY: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

let parsedCache: ReturnType<typeof envSchema.safeParse> | null = null;

function getParsed() {
  if (!parsedCache || !parsedCache.success) {
    parsedCache = envSchema.safeParse(process.env);
    if (!parsedCache.success) {
      console.warn('⚠️ Environment variable validation failed:');
      console.warn(JSON.stringify(parsedCache.error.format(), null, 2));
    }
  }
  return parsedCache;
}

export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_, prop: string) {
    const parsed = getParsed();
    if (!parsed.success) {
      const errors = parsed.error.format();
      if (prop in envSchema.shape && errors[prop as keyof typeof envSchema.shape]) {
        throw new Error(
          `Environment variable "${prop}" is missing or invalid: ${JSON.stringify(
            errors[prop as keyof typeof envSchema.shape]
          )}`
        );
      }
    }
    return (parsed.data as Record<string, unknown>)?.[prop] ?? process.env[prop];
  },
});

