import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ApiFailure } from '@/api/envelopes';
import { ApiFailureNotice, manualRetryDelay, rateLimitPresentation, scheduleManualRetry } from './ApiFailureNotice';

describe('ApiFailureNotice', () => {
  it('blocks retry and reports the remaining cooldown', () => {
    const failure = new ApiFailure(
      { error: 'slow down', code: 'rate_limited' },
      429,
      new Headers({ 'Retry-After': '45' }),
    );
    const state = rateLimitPresentation(failure, failure.retryAt! - 12_400);
    expect(state).toEqual({ rateLimited: true, remainingSeconds: 13, retryAllowed: false, suffix: ' Retry available in 13s. Automatic retries are disabled.' });
  });

  it('allows only a manual retry after cooldown', () => {
    const failure = new ApiFailure({ error: 'slow down', code: 'rate_limited', retryAfter: 1 }, 429);
    expect(rateLimitPresentation(failure, failure.retryAt! + 1).retryAllowed).toBe(true);
  });

  it('renders the machine kind and request ID', () => {
    const failure = new ApiFailure({ error: 'denied' }, 403, new Headers({ 'X-Request-ID': 'request-1' }));
    const html = renderToStaticMarkup(<ApiFailureNotice error={failure} title="Read failed" />);
    expect(html).toContain('authorization · denied');
    expect(html).toContain('requestId: request-1');
  });

  it('bounds manual retry jitter to 250–1000ms', () => {
    expect(manualRetryDelay(() => 0)).toBe(250);
    expect(manualRetryDelay(() => 1)).toBe(1000);
    expect(manualRetryDelay(() => -1)).toBe(250);
    expect(manualRetryDelay(() => 2)).toBe(1000);
  });

  it('does not schedule a duplicate manual retry', () => {
    let calls = 0;
    const schedule = (_callback: () => void, _delay: number) => { calls += 1; return 42; };
    const first = scheduleManualRetry(undefined, () => undefined, schedule, () => 0);
    const second = scheduleManualRetry(first, () => undefined, schedule, () => 0);
    expect(first).toBe(42);
    expect(second).toBe(42);
    expect(calls).toBe(1);
  });
});
