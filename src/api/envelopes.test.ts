import { describe, expect, it } from 'vitest';

import {
  ApiFailure,
  parseUnavailableRead,
  pickResource,
  pickResources,
  unwrap,
  unwrapCommand,
  type ErrorEnvelope,
  type PublicData,
  type SuccessEnvelope,
} from './envelopes';

function errorEnvelope(overrides: {
  code?: string;
  message?: string;
  category?: string;
  retryable?: boolean;
  requestId?: string;
}): ErrorEnvelope {
  return {
    error: {
      code: overrides.code ?? 'some_error',
      message: overrides.message ?? 'Something went wrong.',
      details: {
        ...(overrides.category ? { category: overrides.category } : {}),
        ...(overrides.retryable !== undefined ? { retryable: overrides.retryable } : {}),
      },
    },
    meta: {
      requestId: overrides.requestId ?? 'req_1',
      correlationId: 'corr_1',
      timestamp: '2026-07-20T00:00:00.000Z',
    },
  } as unknown as ErrorEnvelope;
}

function response(status: number): Response {
  return new Response(null, { status });
}

describe('ApiFailure', () => {
  it('extracts code, category, retryable, requestId, and message from the envelope', () => {
    const failure = new ApiFailure(
      errorEnvelope({
        code: 'instance_not_ready',
        message: 'Instance is not ready.',
        category: 'business',
        retryable: true,
        requestId: 'req_abc',
      }),
      409,
    );

    expect(failure.name).toBe('ApiFailure');
    expect(failure.message).toBe('Instance is not ready.');
    expect(failure.code).toBe('instance_not_ready');
    expect(failure.category).toBe('business');
    expect(failure.retryable).toBe(true);
    expect(failure.requestId).toBe('req_abc');
    expect(failure).toBeInstanceOf(Error);
  });

  it('falls back to http-derived defaults when the envelope is undefined', () => {
    const failure = new ApiFailure(undefined, 503);

    expect(failure.message).toBe('Request failed with status 503');
    expect(failure.code).toBe('http_503');
    expect(failure.category).toBe('unknown');
    expect(failure.retryable).toBe(false);
    expect(failure.requestId).toBeUndefined();
  });

  it('treats a missing retryable flag as non-retryable and unknown category', () => {
    const failure = new ApiFailure(errorEnvelope({ code: 'boom' }), 500);

    expect(failure.category).toBe('unknown');
    expect(failure.retryable).toBe(false);
  });
});

describe('parseUnavailableRead', () => {
  it('detects a single unavailable data object and keeps the reason code', () => {
    const result = parseUnavailableRead({
      data: { readStatus: 'unavailable', reasonCode: 'projection_rebuilding' },
    });

    expect(result).toEqual({ readStatus: 'unavailable', reasonCode: 'projection_rebuilding' });
  });

  it('detects an array where every item is unavailable', () => {
    const result = parseUnavailableRead({
      data: [
        { readStatus: 'unavailable', reasonCode: 'cold_start' },
        { readStatus: 'unavailable', reasonCode: 'cold_start' },
      ],
    });

    expect(result).toEqual({ readStatus: 'unavailable', reasonCode: 'cold_start' });
  });

  it('returns undefined when only some array items are unavailable', () => {
    const result = parseUnavailableRead({
      data: [{ readStatus: 'unavailable' }, { readStatus: 'ok' }],
    });

    expect(result).toBeUndefined();
  });

  it('falls back to meta.query when data is not itself unavailable', () => {
    const result = parseUnavailableRead({
      data: [],
      meta: { query: { readStatus: 'unavailable', reasonCode: 'index_lag' } },
    });

    expect(result).toEqual({ readStatus: 'unavailable', reasonCode: 'index_lag' });
  });

  it('omits reasonCode when it is not a string', () => {
    const result = parseUnavailableRead({ data: { readStatus: 'unavailable', reasonCode: 42 } });

    expect(result).toEqual({ readStatus: 'unavailable' });
  });

  it('returns undefined for shapes that do not report an unavailable read', () => {
    expect(parseUnavailableRead(undefined)).toBeUndefined();
    expect(parseUnavailableRead(null)).toBeUndefined();
    expect(parseUnavailableRead('nope')).toBeUndefined();
    expect(parseUnavailableRead({ error: { code: 'x' } })).toBeUndefined();
    expect(parseUnavailableRead({ data: { readStatus: 'ok' } })).toBeUndefined();
  });
});

describe('unwrap', () => {
  it('returns data when present', () => {
    expect(unwrap({ data: { value: 1 }, response: response(200) })).toEqual({ value: 1 });
  });

  it('throws an ApiFailure carrying the response status when data is absent', () => {
    expect(() =>
      unwrap({ error: errorEnvelope({ code: 'bad' }), response: response(422) }),
    ).toThrowError(ApiFailure);

    try {
      unwrap({ error: errorEnvelope({ code: 'bad', category: 'validation' }), response: response(422) });
    } catch (error) {
      expect(error).toBeInstanceOf(ApiFailure);
      expect((error as ApiFailure).code).toBe('bad');
      expect((error as ApiFailure).category).toBe('validation');
    }
  });
});

describe('unwrapCommand', () => {
  function successEnvelope(data: Record<string, unknown>): SuccessEnvelope {
    return {
      data,
      meta: { requestId: 'req_cmd', correlationId: 'corr', timestamp: '2026-07-20T00:00:00.000Z' },
    } as unknown as SuccessEnvelope;
  }

  it('marks a 202 response as accepted (asynchronous)', () => {
    const result = unwrapCommand({
      data: successEnvelope({ resourceType: 'operation', operationStatus: 'pending' }),
      response: response(202),
    });

    expect(result.disposition).toBe('accepted');
    expect(result.operation).toEqual({ resourceType: 'operation', operationStatus: 'pending' });
    expect(result.requestId).toBe('req_cmd');
  });

  it('marks a 200 response as completed and omits operation data when absent', () => {
    const result = unwrapCommand({
      data: successEnvelope({ resourceType: 'instance', id: 'inst_1' }),
      response: response(200),
    });

    expect(result.disposition).toBe('completed');
    expect(result.operation).toBeUndefined();
    expect(result.data).toEqual({ resourceType: 'instance', id: 'inst_1' });
  });

  it('throws when the command response carries an error instead of data', () => {
    expect(() =>
      unwrapCommand({ error: errorEnvelope({ code: 'denied' }), response: response(403) }),
    ).toThrowError(ApiFailure);
  });
});

describe('pickResource / pickResources', () => {
  const instance = { resourceType: 'instance', id: 'inst_1' } as unknown as PublicData;
  const session = { resourceType: 'session', id: 'sess_1' } as unknown as PublicData;

  it('returns the resource when the type matches and undefined otherwise', () => {
    expect(pickResource(instance, 'instance')).toBe(instance);
    expect(pickResource(instance, 'session')).toBeUndefined();
    expect(pickResource(undefined, 'instance')).toBeUndefined();
  });

  it('filters a collection down to the requested resource type', () => {
    expect(pickResources([instance, session, instance], 'instance')).toEqual([instance, instance]);
    expect(pickResources([session], 'instance')).toEqual([]);
    expect(pickResources(undefined, 'instance')).toEqual([]);
  });
});
