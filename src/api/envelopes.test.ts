import { describe, expect, it } from 'vitest';

import { ApiFailure, notImplemented, unwrap, unwrapCommand } from './envelopes';

function response(status: number): Response {
  return new Response(null, { status });
}

describe('ApiFailure', () => {
  it('uses the omniwa-go error string as the message', () => {
    const failure = new ApiFailure({ error: 'phone number is required' }, 400);
    expect(failure.name).toBe('ApiFailure');
    expect(failure.message).toBe('phone number is required');
    expect(failure.httpStatus).toBe(400);
    expect(failure).toBeInstanceOf(Error);
  });

  it('falls back to a status message when there is no error string', () => {
    expect(new ApiFailure(undefined, 503).message).toBe('Request failed with status 503');
    expect(new ApiFailure({}, 500).message).toBe('Request failed with status 500');
  });

  it.each([
    [401, 'authentication'],
    [403, 'authorization'],
    [404, 'not_found'],
    [409, 'conflict'],
    [429, 'rate_limited'],
    [400, 'validation'],
    [422, 'validation'],
    [500, 'internal'],
    [503, 'internal'],
    [501, 'not_implemented'],
  ] as const)('maps HTTP %i to category %s', (status, category) => {
    expect(new ApiFailure({ error: 'x' }, status).category).toBe(category);
  });

  it('marks transient 5xx as retryable, but not 501, 429, or rate limits', () => {
    expect(new ApiFailure({}, 500).retryable).toBe(true);
    expect(new ApiFailure({}, 503).retryable).toBe(true);
    expect(new ApiFailure({}, 501).retryable).toBe(false);
    expect(new ApiFailure({}, 429).retryable).toBe(false);
    expect(new ApiFailure({}, 400).retryable).toBe(false);
    expect(new ApiFailure({}, 404).retryable).toBe(false);
  });

  it('classifies a WhatsApp throttle surfaced as a 500 body as rate_limited (not retryable)', () => {
    const failure = new ApiFailure({ error: 'info query returned status 429: rate-overlimit' }, 500);
    expect(failure.category).toBe('rate_limited');
    expect(failure.retryable).toBe(false);
  });

  it('never carries a request id', () => {
    expect(new ApiFailure({ error: 'x' }, 400).requestId).toBeUndefined();
  });
});

describe('notImplemented', () => {
  it('is a 501 not_implemented ApiFailure naming the resource', () => {
    const failure = notImplemented('Webhooks');
    expect(failure).toBeInstanceOf(ApiFailure);
    expect(failure.httpStatus).toBe(501);
    expect(failure.category).toBe('not_implemented');
    expect(failure.message).toContain('Webhooks');
  });
});

describe('unwrap', () => {
  it('returns the inner data from a { message, data } envelope', () => {
    expect(unwrap({ data: { message: 'success', data: { id: 'inst_1' } }, response: response(200) })).toEqual({
      id: 'inst_1',
    });
  });

  it('returns raw payloads that are not wrapped in an envelope', () => {
    expect(unwrap({ data: [{ id: 'g1' }, { id: 'g2' }], response: response(200) })).toEqual([
      { id: 'g1' },
      { id: 'g2' },
    ]);
  });

  it('throws an ApiFailure carrying the response status when data is absent', () => {
    try {
      unwrap({ error: { error: 'not found' }, response: response(404) });
      throw new Error('expected throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiFailure);
      expect((error as ApiFailure).category).toBe('not_found');
      expect((error as ApiFailure).message).toBe('not found');
    }
  });
});

describe('unwrapCommand', () => {
  it('always reports a completed disposition and keeps the message', () => {
    const result = unwrapCommand({
      data: { message: 'success', data: { token: 'abc' } },
      response: response(200),
    });
    expect(result.disposition).toBe('completed');
    expect(result.data).toEqual({ token: 'abc' });
    expect(result.message).toBe('success');
  });

  it('handles a bare success envelope with no data payload', () => {
    const result = unwrapCommand({ data: { message: 'success' }, response: response(200) });
    expect(result.disposition).toBe('completed');
    expect(result.data).toBeUndefined();
    expect(result.message).toBe('success');
  });

  it('throws an ApiFailure when the command returns an error', () => {
    expect(() => unwrapCommand({ error: { error: 'denied' }, response: response(403) })).toThrowError(ApiFailure);
  });
});
