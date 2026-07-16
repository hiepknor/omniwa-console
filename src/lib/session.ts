export type KeyKind = 'api' | 'admin' | 'unknown';

export interface ConsoleSession {
  baseUrl: string;
  apiKey: string;
  keyKind: KeyKind;
  connectedAt: string;
}

const STORAGE_KEY = 'omniwa-console/session';

function storageFor(persistent: boolean): Storage {
  return persistent ? window.localStorage : window.sessionStorage;
}

export function loadSession(): ConsoleSession | null {
  for (const storage of [window.sessionStorage, window.localStorage]) {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as ConsoleSession;
      if (parsed.baseUrl && parsed.apiKey) return parsed;
    } catch {
      storage.removeItem(STORAGE_KEY);
    }
  }
  return null;
}

export function saveSession(session: ConsoleSession, persistent: boolean): void {
  clearSession();
  storageFor(persistent).setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Masked fingerprint safe to display, e.g. "omni…a1b2". */
export function keyFingerprint(apiKey: string): string {
  if (apiKey.length <= 8) return '••••';
  return `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`;
}
