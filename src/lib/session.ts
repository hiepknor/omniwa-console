export type KeyKind = 'api' | 'admin' | 'unknown';

export interface ConsoleSession {
  baseUrl: string;
  apiKey: string;
  keyKind: KeyKind;
  connectedAt: string;
}

const LEGACY_STORAGE_KEY = 'omniwa-console/session';

export function clearSession(): void {
  // Remove credentials left by Console builds that predate the memory-only
  // session boundary. Current sessions are never written to browser storage.
  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      storage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // A blocked storage API must not prevent the in-memory session clearing.
    }
  }
}

/** Masked fingerprint safe to display, e.g. "omni…a1b2". */
export function keyFingerprint(apiKey: string): string {
  if (apiKey.length <= 8) return '••••';
  return `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`;
}
