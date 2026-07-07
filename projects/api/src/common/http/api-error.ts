import { HttpStatus } from '@nestjs/common';

/**
 * Standard error envelope shared by every endpoint (documents/04-API-Design.md §2).
 * The success envelope lives in `api-response.ts`.
 */
export interface ErrorDetail {
  field?: string;
  issue: string;
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'PAYMENT_REQUIRED'
  | 'INTERNAL_ERROR';

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: ErrorDetail[];
    requestId: string;
  };
}

// Keyed by numeric status so the lookup is a plain number→code map (avoids
// enum-comparison pitfalls). Anything unlisted falls back to INTERNAL_ERROR.
const STATUS_TO_CODE = new Map<number, ApiErrorCode>([
  [HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR'],
  [HttpStatus.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR'],
  [HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED'],
  [HttpStatus.PAYMENT_REQUIRED, 'PAYMENT_REQUIRED'],
  [HttpStatus.FORBIDDEN, 'FORBIDDEN'],
  [HttpStatus.NOT_FOUND, 'NOT_FOUND'],
  [HttpStatus.CONFLICT, 'CONFLICT'],
  [HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMITED'],
]);

/** Map an HTTP status to the API's stable error code (documents/04 §2). */
export function codeForStatus(status: number): ApiErrorCode {
  return STATUS_TO_CODE.get(status) ?? 'INTERNAL_ERROR';
}

/** Assemble the standard error body. */
export function apiError(
  code: ApiErrorCode,
  message: string,
  requestId: string,
  details?: ErrorDetail[],
): ApiErrorBody {
  return {
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {}),
      requestId,
    },
  };
}
