/**
 * ValidationPipe configuration — already configured globally in main.ts.
 * This file exports a pre-configured instance for use in testing or per-route overrides.
 */
import { ValidationPipe } from '@nestjs/common';

export const validationPipeConfig = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
});
