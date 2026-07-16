import type { components } from './generated/schema';

export type SuccessEnvelope = components['schemas']['SuccessEnvelope'];
export type CollectionEnvelope = components['schemas']['CollectionEnvelope'];
export type ErrorEnvelope = components['schemas']['ErrorEnvelope'];
export type ApiErrorBody = components['schemas']['ApiError'];
export type ResponseMeta = components['schemas']['ResponseMeta'];

export type ErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'business'
  | 'conflict'
  | 'infrastructure'
  | 'validation'
  | 'not_found'
  | 'not_implemented'
  | 'internal';

/** Normalized failure surfaced to features; never expose raw responses. */
export class ApiFailure extends Error {
  readonly code: string;
  readonly category: ErrorCategory | 'unknown';
  readonly retryable: boolean;
  readonly requestId: string | undefined;

  constructor(envelope: ErrorEnvelope | undefined, httpStatus: number) {
    const error = envelope?.error;
    super(error?.message ?? `Request failed with status ${httpStatus}`);
    this.name = 'ApiFailure';
    this.code = error?.code ?? `http_${httpStatus}`;
    this.category = (error?.details?.category as ErrorCategory | undefined) ?? 'unknown';
    this.retryable = error?.details?.retryable === true;
    this.requestId = envelope?.meta?.requestId;
  }
}

/**
 * Unwrap an openapi-fetch result: return `data` or throw ApiFailure.
 * Features consume this via query/mutation hooks, never raw responses.
 */
export function unwrap<T>(result: {
  data?: T;
  error?: unknown;
  response: Response;
}): T {
  if (result.data !== undefined) return result.data;
  throw new ApiFailure(result.error as ErrorEnvelope | undefined, result.response.status);
}
