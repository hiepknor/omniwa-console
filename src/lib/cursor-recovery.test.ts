import { describe, expect, it } from 'vitest';
import { cursorRecoveryAction } from './cursor-recovery';

describe('cursorRecoveryAction', () => {
  it('resets an invalid scoped cursor instead of retrying it forever', () => {
    expect(cursorRecoveryAction('invalid_cursor', 'opaque-value')).toBe('reset');
  });

  it('retries ordinary failures and an initial request without a cursor', () => {
    expect(cursorRecoveryAction('internal_error', 'opaque-value')).toBe('retry');
    expect(cursorRecoveryAction('invalid_cursor', undefined)).toBe('retry');
  });
});
