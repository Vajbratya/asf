import { z } from 'zod';

/**
 * Environment variable schema
 * All required environment variables must be defined and valid
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3001'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Redis/Upstash
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required'),

  // QStash (optional for initial deployment)
  QSTASH_TOKEN: z.string().optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().optional(),

  // CORS
  ALLOWED_ORIGINS: z.string().min(1, 'ALLOWED_ORIGINS is required (comma-separated list)'),

  // WorkOS (if used)
  WORKOS_API_KEY: z.string().optional(),
  WORKOS_CLIENT_ID: z.string().optional(),
  WORKOS_COOKIE_PASSWORD: z
    .string()
    .min(32, 'WORKOS_COOKIE_PASSWORD must be at least 32 characters')
    .optional(),

  // Optional API Keys
  OPENAI_API_KEY: z.string().optional(),
});

/**
 * Validates and parses environment variables
 * @throws {ZodError} if validation fails
 */
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => {
        return `  - ${issue.path.join('.')}: ${issue.message}`;
      });

      console.error('\n=================================');
      console.error('Environment Validation Failed');
      console.error('=================================');
      console.error('Missing or invalid environment variables:\n');
      console.error(issues.join('\n'));
      console.error('\nPlease check your .env file and ensure all required variables are set.\n');

      process.exit(1);
    }
    throw error;
  }
}

/**
 * Validated environment variables
 * Use this instead of process.env for type safety
 */
export const env = validateEnv();

/**
 * Get allowed CORS origins as an array
 */
export function getAllowedOrigins(): string[] {
  return env.ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
