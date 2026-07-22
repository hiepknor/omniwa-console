import { describe, expect, it } from 'vitest';
import { projectionPresentation } from './ProjectionNotice';

describe('projectionPresentation', () => {
  it('stays quiet for a ready projection', () => {
    expect(projectionPresentation('ready')).toBeUndefined();
  });

  it('distinguishes syncing, stale, not-started, and failed states', () => {
    expect(projectionPresentation('syncing')?.kind).toBe('info');
    expect(projectionPresentation('stale')?.kind).toBe('warning');
    expect(projectionPresentation('not_started')?.title).toContain('not ready');
    expect(projectionPresentation('failed')?.kind).toBe('error');
  });
});
