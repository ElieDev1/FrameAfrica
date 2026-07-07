import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import type { ErrorDetail } from './common/http/api-error';

/** Flatten class-validator errors into the API's `{ field, issue }` detail shape. */
function toValidationDetails(errors: ValidationError[]): ErrorDetail[] {
  const details: ErrorDetail[] = [];
  const walk = (error: ValidationError, path: string) => {
    const field = path ? `${path}.${error.property}` : error.property;
    for (const issue of Object.values(error.constraints ?? {})) {
      details.push({ field, issue });
    }
    for (const child of error.children ?? []) {
      walk(child, field);
    }
  };
  for (const error of errors) walk(error, '');
  return details;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.setGlobalPrefix('v1', { exclude: ['health'] });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Emit the standard error envelope's `code` + per-field `details`; the
      // global filter passes them through unchanged (documents/04 §2).
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed.',
          details: toValidationDetails(errors),
        }),
    }),
  );

  // Default to 4000 so the API and the Next.js dev server (3000) don't collide;
  // matches API_URL in .env.example.
  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
