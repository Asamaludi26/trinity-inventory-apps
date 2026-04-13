import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SWAGGER_ENABLED: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),
  UPLOAD_DIR: z.string().default('./uploads'),
  WHATSAPP_API_URL: z.string().url().optional(),
  WHATSAPP_TOKEN: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        const parsed = envSchema.safeParse(config);
        if (!parsed.success) {
          const errors = parsed.error.flatten().fieldErrors;
          throw new Error(
            `Environment validation failed:\n${JSON.stringify(errors, null, 2)}`,
          );
        }
        return parsed.data;
      },
    }),
  ],
})
export class AppConfigModule {}
