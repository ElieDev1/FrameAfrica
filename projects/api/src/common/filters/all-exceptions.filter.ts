import { randomUUID } from 'node:crypto';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { type ApiErrorCode, apiError, codeForStatus, type ErrorDetail } from '../http/api-error';

/** 5xx boundary — at or above this, report generically and log the real error. */
const SERVER_ERROR_STATUS = 500;

/**
 * Catches every unhandled exception and returns the standard error envelope
 * (documents/04-API-Design.md §2). Client (4xx) messages pass through; server
 * (5xx) errors are logged with their stack but reported generically so no
 * internal detail leaks (documents/05-Security-Design.md §8).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const requestId = requestIdOf(req);

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Never surface internal details for server errors (5xx).
    if (status >= SERVER_ERROR_STATUS) {
      this.logger.error(
        `${req.method} ${req.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      res.status(status).json(apiError('INTERNAL_ERROR', 'Something went wrong.', requestId));
      return;
    }

    const { code, message, details } = describe(exception as HttpException, status);
    res.status(status).json(apiError(code, message, requestId, details));
  }
}

function requestIdOf(req: Request): string {
  const header = req.headers['x-request-id'];
  if (typeof header === 'string' && header.length > 0) return header;
  return randomUUID();
}

interface Described {
  code: ApiErrorCode;
  message: string;
  details?: ErrorDetail[];
}

/** Extract code/message/details from a client-side HttpException. */
function describe(exception: HttpException, status: number): Described {
  const fallbackCode = codeForStatus(status);
  const body = exception.getResponse();

  if (typeof body === 'string') {
    return { code: fallbackCode, message: body };
  }

  const record = body as Record<string, unknown>;

  // A handler/pipe that already speaks our envelope (e.g. the ValidationPipe
  // exceptionFactory) wins — trust its code and details verbatim.
  const code = isApiErrorCode(record.code) ? record.code : fallbackCode;
  const details = normalizeDetails(record.details ?? record.message);
  const message = pickMessage(record, exception.message);

  return { code, message, ...(details ? { details } : {}) };
}

function pickMessage(record: Record<string, unknown>, fallback: string): string {
  // class-validator puts the field errors in `message` (an array); use a stable
  // summary there and keep the per-field text in `details` instead.
  if (Array.isArray(record.message)) return 'Request validation failed.';
  if (typeof record.message === 'string') return record.message;
  return fallback;
}

function normalizeDetails(value: unknown): ErrorDetail[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const details: ErrorDetail[] = [];
  for (const item of value) {
    if (typeof item === 'string') {
      details.push({ issue: item });
    } else if (item && typeof item === 'object' && 'issue' in item) {
      const record = item as { field?: unknown; issue: unknown };
      details.push({
        ...(typeof record.field === 'string' ? { field: record.field } : {}),
        issue: String(record.issue),
      });
    }
  }
  return details.length > 0 ? details : undefined;
}

const API_ERROR_CODES: ReadonlySet<string> = new Set([
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'PAYMENT_REQUIRED',
  'INTERNAL_ERROR',
]);

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === 'string' && API_ERROR_CODES.has(value);
}
