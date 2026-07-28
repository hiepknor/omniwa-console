import { describe, expect, it, vi } from 'vitest';
import { createCommandKeyStore } from './command-key';

describe('Group management idempotency keys', () => {
  it('reuses a key for retrying the same payload after a transport failure', () => {
    const randomUUID = vi.fn().mockReturnValueOnce('key-1').mockReturnValueOnce('key-2');
    const keys = createCommandKeyStore(randomUUID);

    expect(keys.for('same-payload')).toBe('key-1');
    expect(keys.for('same-payload')).toBe('key-1');
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it('creates a new key when the payload changes or a typed outcome clears the command', () => {
    const randomUUID = vi.fn().mockReturnValueOnce('key-1').mockReturnValueOnce('key-2').mockReturnValueOnce('key-3');
    const keys = createCommandKeyStore(randomUUID);

    expect(keys.for('payload-a')).toBe('key-1');
    expect(keys.for('payload-b')).toBe('key-2');
    keys.clear();
    expect(keys.for('payload-b')).toBe('key-3');
  });
});
