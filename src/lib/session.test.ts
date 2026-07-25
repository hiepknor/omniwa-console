import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearSession, keyFingerprint } from './session';

describe('memory-only Console session', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('removes credentials left by legacy storage-backed builds', () => {
    const sessionStorage = { removeItem: vi.fn() };
    const localStorage = { removeItem: vi.fn() };
    vi.stubGlobal('window', { sessionStorage, localStorage });

    clearSession();

    expect(sessionStorage.removeItem).toHaveBeenCalledWith('omniwa-console/session');
    expect(localStorage.removeItem).toHaveBeenCalledWith('omniwa-console/session');
  });

  it('renders only a bounded fingerprint', () => {
    expect(keyFingerprint('admin-secret-123456')).toBe('admi…3456');
    expect(keyFingerprint('short')).toBe('••••');
  });
});
