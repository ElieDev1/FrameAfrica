import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import type { ApiErrorBody } from '../http/api-error';

interface Captured {
  status: number;
  body: ApiErrorBody;
}

function run(exception: unknown, headers: Record<string, string> = {}): Captured {
  const filter = new AllExceptionsFilter();
  const captured = {} as Captured;

  const res = {
    status(code: number) {
      captured.status = code;
      return this;
    },
    json(body: ApiErrorBody) {
      captured.body = body;
      return this;
    },
  };
  const req = { method: 'GET', url: '/v1/x', headers };

  const host = {
    switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
  } as unknown as ArgumentsHost;

  filter.catch(exception, host);
  return captured;
}

describe('AllExceptionsFilter', () => {
  it('maps NotFoundException to a 404 NOT_FOUND envelope', () => {
    const { status, body } = run(new NotFoundException('Article "x" was not found'));
    expect(status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Article "x" was not found');
    expect(body.error.requestId).toEqual(expect.any(String));
  });

  it.each([
    [new UnauthorizedException(), 401, 'UNAUTHENTICATED'],
    [new ForbiddenException(), 403, 'FORBIDDEN'],
    [new ConflictException(), 409, 'CONFLICT'],
  ])('maps %s to the right code', (exception, expectedStatus, expectedCode) => {
    const { status, body } = run(exception);
    expect(status).toBe(expectedStatus);
    expect(body.error.code).toBe(expectedCode);
  });

  it('passes through the ValidationPipe code + per-field details', () => {
    const { status, body } = run(
      new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: [{ field: 'title', issue: 'title should not be empty' }],
      }),
    );
    expect(status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toEqual([{ field: 'title', issue: 'title should not be empty' }]);
  });

  it('turns a raw class-validator message array into details', () => {
    const { body } = run(new BadRequestException(['email must be an email']));
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('Request validation failed.');
    expect(body.error.details).toEqual([{ issue: 'email must be an email' }]);
  });

  it('reports unknown errors as a generic 500 without leaking details', () => {
    const { status, body } = run(new Error('DB password is hunter2'));
    expect(status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('Something went wrong.');
    expect(JSON.stringify(body)).not.toContain('hunter2');
  });

  it('honors an inbound x-request-id for correlation', () => {
    const { body } = run(new NotFoundException(), { 'x-request-id': 'req_abc123' });
    expect(body.error.requestId).toBe('req_abc123');
  });
});
