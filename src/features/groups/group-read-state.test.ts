import { describe, expect, it } from 'vitest';
import { groupCollectionState } from './group-read-state';

const base = {
  hasInitialError: false,
  hasResource: true,
  isInitialLoading: false,
  itemCount: 1,
  readinessAdvertised: true,
  unavailable: false,
};

describe('groupCollectionState', () => {
  it.each([
    [{ ...base, hasResource: false, errorCode: 'projection_not_ready', hasInitialError: true }, 'not_ready'],
    [{ ...base, errorCode: 'projection_not_ready' }, 'ready'],
    [{ ...base, hasInitialError: true }, 'error'],
    [{ ...base, hasResource: false, isInitialLoading: true, itemCount: 0 }, 'loading'],
    [{ ...base, itemCount: 0, projectionStatus: 'not_started' as const }, 'unavailable'],
    [{ ...base, itemCount: 0, projectionStatus: 'failed' as const }, 'unavailable'],
    [{ ...base, itemCount: 0, projectionStatus: 'syncing' as const }, 'syncing'],
    [{ ...base, itemCount: 0, projectionStatus: undefined, readinessAdvertised: false }, 'unavailable'],
    [{ ...base, itemCount: 0, projectionStatus: 'ready' as const }, 'empty'],
    [{ ...base, projectionStatus: 'syncing' as const }, 'ready'],
    [{ ...base, projectionStatus: 'stale' as const }, 'ready'],
  ] as const)('maps %o to %s', (input, expected) => {
    expect(groupCollectionState(input)).toBe(expected);
  });
});
