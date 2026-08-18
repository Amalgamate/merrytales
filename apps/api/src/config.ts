import 'dotenv/config';
import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  WEB_ORIGIN: z.string().default('http://127.0.0.1:5174,http://localhost:5173'),
  MPESA_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  MPESA_CONSUMER_KEY: z.string().optional(),
  MPESA_CONSUMER_SECRET: z.string().optional(),
  MPESA_SHORTCODE: z.string().optional(),
  MPESA_PASSKEY: z.string().optional(),
  MPESA_CALLBACK_URL: z.string().url().optional(),
  MOBILESASA_ENCRYPTION_KEY: z.string().min(32).optional(),
  OPENAI_MODEL: z.string().optional(),
});

export const config = configSchema.parse(process.env);
export const allowedOrigins = config.WEB_ORIGIN.split(',').map((origin) => origin.trim());
export const primaryWebOrigin = allowedOrigins[0] ?? 'http://localhost:5173';
