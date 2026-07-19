import type { components } from './generated/schema';

export type SuccessEnvelope = components['schemas']['SuccessEnvelope'];
export type CollectionEnvelope = components['schemas']['CollectionEnvelope'];
export type ErrorEnvelope = components['schemas']['ErrorEnvelope'];
export type ApiErrorBody = components['schemas']['ApiError'];
export type ResponseMeta = components['schemas']['ResponseMeta'];
export type PublicData = components['schemas']['PublicData'];

export type UnavailableRead = { readStatus: 'unavailable'; reasonCode?: string };

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

/** Detect a non-2xx data envelope reporting an unavailable projection read. */
export function parseUnavailableRead(body: unknown): UnavailableRead | undefined {
  if (typeof body !== 'object' || body === null || !('data' in body)) return undefined;

  const { data } = body;
  const unavailable = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' &&
    value !== null &&
    'readStatus' in value &&
    value.readStatus === 'unavailable';

  const first = Array.isArray(data)
    ? data.length > 0 && data.every(unavailable)
      ? data[0]
      : undefined
    : unavailable(data)
      ? data
      : undefined;

  const metaQuery = 'meta' in body && typeof body.meta === 'object' && body.meta !== null && 'query' in body.meta
    ? body.meta.query
    : undefined;
  const reported = first ?? (unavailable(metaQuery) ? metaQuery : undefined);

  if (reported === undefined) return undefined;
  return {
    readStatus: 'unavailable',
    ...(typeof reported.reasonCode === 'string' ? { reasonCode: reported.reasonCode } : {}),
  };
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

/** Narrow a SuccessEnvelope's data to one resourceType; undefined if it doesn't match. */
export function pickResource<T extends PublicData['resourceType']>(
  data: PublicData | undefined,
  resourceType: T,
): Extract<PublicData, { resourceType: T }> | undefined {
  if (data?.resourceType !== resourceType) return undefined;
  return data as Extract<PublicData, { resourceType: T }>;
}

/** Narrow a CollectionEnvelope's data array, keeping only the given resourceType. */
export function pickResources<T extends PublicData['resourceType']>(
  data: PublicData[] | undefined,
  resourceType: T,
): Extract<PublicData, { resourceType: T }>[] {
  return (data ?? []).filter(
    (item): item is Extract<PublicData, { resourceType: T }> =>
      item?.resourceType === resourceType,
  );
}
