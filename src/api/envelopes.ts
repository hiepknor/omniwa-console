import type { components } from './generated/schema';
import type { components as platformComponents } from './generated/platform-schema';

/**
 * Frozen omniwa Platform types, kept only so the panels that omniwa-go has no
 * backend for (webhooks, queue, settings, overview, events, chats) keep
 * type-checking while their data calls throw `notImplemented`. Do not use these
 * for new omniwa-go code.
 */
export type PublicData = platformComponents['schemas']['PublicData'];
export type OperationData = platformComponents['schemas']['OperationData'];
export type CollectionEnvelope = platformComponents['schemas']['CollectionEnvelope'];
export type UnavailableRead = { readStatus: 'unavailable'; reasonCode?: string };

/**
 * omniwa-go wraps successful payloads in `{ message, data }`. A handful of
 * endpoints (`/group/list`, `/instance/logs`, `/label/list`, `/polls/{id}/results`)
 * return the payload directly with no wrapper.
 */
export type SuccessEnvelope<T = unknown> = { message?: string; data?: T };

/** omniwa-go error body: a single opaque string. */
export type ApiErrorBody = components['schemas']['apidocs.ErrorResponse'];

/**
 * Product-safe failure categories. omniwa-go does not send a category, so it is
 * inferred from the HTTP status. `not_implemented` is synthesized locally for
 * console panels that omniwa-go has no backend for.
 */
export type ErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'internal'
  | 'not_implemented';

/**
 * Command results are always synchronous on omniwa-go (no async 202 / operation
 * ids). `requestId` and `operation` stay on the type as always-undefined
 * compatibility fields so feature code that referenced them keeps compiling.
 */
export type CommandResult = {
  disposition: 'completed';
  data: unknown;
  message?: string;
  requestId?: string;
  operation?: OperationData;
};

function categoryForStatus(status: number): ErrorCategory {
  switch (status) {
    case 401:
      return 'authentication';
    case 403:
      return 'authorization';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    case 429:
      return 'rate_limited';
    case 400:
    case 422:
      return 'validation';
    case 501:
      return 'not_implemented';
    default:
      return status >= 500 ? 'internal' : 'validation';
  }
}

/** Normalized failure surfaced to features; never expose raw responses. */
export class ApiFailure extends Error {
  readonly category: ErrorCategory;
  readonly httpStatus: number;
  readonly retryable: boolean;
  /** omniwa-go never returns a request id; kept for surface compatibility. */
  readonly requestId: string | undefined = undefined;

  constructor(errorBody: unknown, httpStatus: number) {
    const message =
      errorBody && typeof errorBody === 'object' && 'error' in errorBody && typeof errorBody.error === 'string'
        ? errorBody.error
        : `Request failed with status ${httpStatus}`;
    super(message);
    this.name = 'ApiFailure';
    this.httpStatus = httpStatus;
    this.category = categoryForStatus(httpStatus);
    // Transient conditions worth an automatic retry.
    this.retryable = httpStatus === 429 || httpStatus >= 500;
  }
}

/** A failure for console panels that omniwa-go provides no backend for. */
export function notImplemented(resource: string): ApiFailure {
  const failure = new ApiFailure({ error: `${resource} is not available on the OmniWA GO API.` }, 501);
  return failure;
}

type FetchResult<T> = {
  data?: T;
  error?: unknown;
  response: Response;
};

/**
 * omniwa-go wraps most payloads as `{ message, data }`. A few endpoints return
 * the payload raw (an array or object with no `message` key). Detect an envelope
 * by the presence of a string `message` field.
 */
function isEnvelope(body: unknown): body is SuccessEnvelope {
  return (
    body !== null &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    'message' in body &&
    typeof (body as { message?: unknown }).message === 'string'
  );
}

/**
 * Unwrap an openapi-fetch result: return the inner payload or throw ApiFailure.
 * Handles both the `{ message, data }` envelope and raw-payload endpoints.
 */
export function unwrap<T>(result: FetchResult<SuccessEnvelope<T> | T>): T {
  if (result.data !== undefined) {
    const body = result.data;
    return isEnvelope(body) ? (body.data as T) : (body as T);
  }
  throw new ApiFailure(result.error, result.response.status);
}

/** Command variant: preserves the envelope message alongside the completed disposition. */
export function unwrapCommand(result: FetchResult<SuccessEnvelope>): CommandResult {
  if (result.data !== undefined) {
    const body = result.data;
    return {
      disposition: 'completed',
      data: isEnvelope(body) ? body.data : body,
      message: isEnvelope(body) ? body.message : undefined,
    };
  }
  throw new ApiFailure(result.error, result.response.status);
}
