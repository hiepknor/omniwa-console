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
    // omniwa-go surfaces WhatsApp throttling as a 500 whose body carries the
    // upstream 429 (e.g. "info query returned status 429: rate-overlimit").
    // Treat that as rate_limited so the client backs off instead of retrying.
    const rateLimited = httpStatus === 429 || /rate.?over.?limit|status 429|too many|rate.?limit/i.test(message);
    this.category = rateLimited ? 'rate_limited' : categoryForStatus(httpStatus);
    // A rate-limited condition must NOT be auto-retried (retrying deepens the throttle).
    this.retryable = !rateLimited && (httpStatus >= 500 && httpStatus !== 501);
  }
}

/** A failure for console command paths that omniwa-go provides no backend for. */
export function notImplemented(resource: string): ApiFailure {
  const failure = new ApiFailure({ error: `${resource} is not available on the OmniWA GO API.` }, 501);
  return failure;
}

/**
 * Neutral "unavailable" marker for reads that omniwa-go has no backend for.
 * Read stubs return this (rather than throwing) so panels render their calm
 * unavailable state instead of a red error surface.
 */
export const NOT_IMPLEMENTED_READ: UnavailableRead = { readStatus: 'unavailable', reasonCode: 'not_implemented' };

/**
 * openapi-fetch result. Typed loosely as `unknown` data because several
 * whatsmeow-derived omniwa-go endpoints are mis-typed by the swaggo spec (their
 * runtime shape differs from the generated schema); the unwrap helpers narrow by
 * runtime shape instead of trusting the generated response type.
 */
type FetchResult = {
  data?: unknown;
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
export function unwrap<T>(result: FetchResult): T {
  if (result.data !== undefined) {
    const body = result.data;
    return isEnvelope(body) ? (body.data as T) : (body as T);
  }
  throw new ApiFailure(result.error, result.response.status);
}

/** Command variant: preserves the envelope message alongside the completed disposition. */
export function unwrapCommand(result: FetchResult): CommandResult {
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
