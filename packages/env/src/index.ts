import { z } from 'zod';

export function createEnv<T extends z.ZodType>(schema: T): z.infer<T> {
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      '❌ Invalid environment variables:',
      ...Object.entries(parsed.error.flatten().fieldErrors).map(([key, value]) => `  ${key}: ${value}`),
    );
    process.exit(1);
  }

  return parsed.data;
}
