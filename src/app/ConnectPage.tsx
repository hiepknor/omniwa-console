import { useState, type FormEvent } from 'react';
import { createApiClient } from '@/api/client';
import { ApiFailure, unwrap } from '@/api/envelopes';
import { saveSession, type ConsoleSession, type KeyKind } from '@/lib/session';

const DEFAULT_BASE_URL = 'http://localhost:3000';

async function detectKeyKind(client: ReturnType<typeof createApiClient>): Promise<KeyKind> {
  try {
    unwrap(await client.GET('/v1/api-keys'));
    return 'admin';
  } catch (error) {
    if (error instanceof ApiFailure && error.category === 'authorization') return 'api';
    return 'unknown';
  }
}

export function ConnectPage({ onConnected }: { onConnected: (session: ConsoleSession) => void }) {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [apiKey, setApiKey] = useState('');
  const [remember, setRemember] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    let origin: string;
    try {
      origin = new URL(baseUrl).origin;
    } catch {
      setError('API base URL must be a valid URL, e.g. http://localhost:3000');
      return;
    }

    setPending(true);
    try {
      const client = createApiClient({ baseUrl: origin, apiKey });
      unwrap(await client.GET('/v1/health'));
      const session: ConsoleSession = {
        baseUrl: origin,
        apiKey,
        keyKind: await detectKeyKind(client),
        connectedAt: new Date().toISOString(),
      };
      saveSession(session, remember);
      onConnected(session);
    } catch (err) {
      if (err instanceof ApiFailure) {
        setError(`${err.category}: ${err.message}${err.requestId ? ` (request ${err.requestId})` : ''}`);
      } else {
        setError('Could not reach the OmniWA API at that address.');
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg border border-zinc-800 p-6">
        <div>
          <h1 className="text-lg font-semibold">OmniWA Console</h1>
          <p className="mt-1 text-sm text-zinc-400">Connect to an OmniWA Platform API.</p>
        </div>
        <label className="block text-sm">
          <span className="text-zinc-400">API base URL</span>
          <input
            type="url"
            required
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">API key</span>
          <input
            type="password"
            required
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember on this device (stores the key in this browser)
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? 'Connecting…' : 'Connect'}
        </button>
      </form>
    </div>
  );
}
