import { useRef, useState, type FormEvent } from 'react';
import { createApiClient, DEFAULT_BASE_URL } from '@/api/client';
import { ApiFailure } from '@/api/envelopes';
import { SurfaceNotice } from '@/components/feedback/SurfaceNotice';
import { useDocumentTitle } from '@/components/useDocumentTitle';
import type { ConsoleSession, KeyKind } from '@/lib/session';

type ConnectError = {
  category: string;
  message: string;
  requestId?: string;
};

export const CONNECT_TIMEOUT_MS = 15_000;

/**
 * Validate the pasted apikey against omniwa-go and classify it. The global admin
 * key can list every instance (`GET /instance/all`); a per-instance token cannot,
 * but can read its own status (`GET /instance/status`). A 401 on both means the
 * key is invalid.
 */
export async function probeKey(
  client: ReturnType<typeof createApiClient>,
  signal?: AbortSignal,
): Promise<KeyKind> {
  const admin = await client.GET('/instance/all', { signal });
  if (admin.data !== undefined) return 'admin';
  if (admin.response.status !== 401 && admin.response.status !== 403) {
    throw new ApiFailure(admin.error, admin.response.status, admin.response.headers);
  }

  const scoped = await client.GET('/instance/status', { signal });
  if (scoped.data !== undefined) return 'api';
  throw new ApiFailure(scoped.error, scoped.response.status, scoped.response.headers);
}

export function normalizeApiOrigin(value: string): string | undefined {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

export function ConnectPage({
  notice,
  onConnected,
}: {
  notice?: 'session-invalid';
  onConnected: (session: ConsoleSession) => void;
}) {
  useDocumentTitle('Connect');
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ConnectError | null>(null);
  const baseUrlInput = useRef<HTMLInputElement>(null);
  const apiKeyInput = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pendingRef.current) return;
    setError(null);

    const origin = normalizeApiOrigin(baseUrl);
    if (!origin) {
      setError({
        category: 'validation',
        message: 'API base URL must be an HTTP(S) origin, e.g. http://localhost:4000',
      });
      baseUrlInput.current?.focus();
      return;
    }

    const normalizedKey = apiKey.trim();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);
    pendingRef.current = true;
    setPending(true);
    try {
      const client = createApiClient({ baseUrl: origin, apiKey: normalizedKey });
      const session: ConsoleSession = {
        baseUrl: origin,
        apiKey: normalizedKey,
        keyKind: await probeKey(client, controller.signal),
        connectedAt: new Date().toISOString(),
      };
      onConnected(session);
    } catch (err) {
      if (controller.signal.aborted) {
        setError({
          category: 'timeout',
          message: 'The OmniWA API did not respond within 15 seconds.',
        });
      } else if (err instanceof ApiFailure) {
        setError({ category: err.category, message: err.message, requestId: err.requestId });
      } else {
        setError({
          category: 'network',
          message: 'Could not reach the OmniWA API at that address.',
        });
      }
    } finally {
      window.clearTimeout(timeoutId);
      pendingRef.current = false;
      setPending(false);
    }
  };

  const canSubmit = normalizeApiOrigin(baseUrl) !== undefined && apiKey.trim().length > 0 && !pending;
  const baseUrlError = error?.category === 'validation' ? error : undefined;
  const connectionError = error?.category !== 'validation' ? error : undefined;

  return (
    <main className="connect-screen">
      <header className="connect-masthead">
        <div className="connect-brand">
          <span className="mark" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M21 12a9 9 0 1 0-18 0c0 1.6.4 3.1 1.2 4.4L3 21l4.6-1.2A9 9 0 0 0 21 12z" />
              <path d="M7.5 12.5h2l1.5 2.5 2-6 1.5 3.5h2" />
            </svg>
          </span>
          <div>
            <strong>OmniWA Console</strong>
            <span>Operations workspace</span>
          </div>
        </div>
        <div className="connect-session-state">
          <span className="dot" style={{ background: 'var(--inactive)' }} />
          No active session
        </div>
      </header>

      {notice === 'session-invalid' && (
        <div className="connect-page-notice">
          <SurfaceNotice
            kind="warning"
            label="Session"
            title="Your API session is no longer valid."
            detail="Enter a valid API key to reconnect to the OmniWA runtime."
            announcement="assertive"
          />
        </div>
      )}

      <div className="connect-layout">
        <section className="connect-intro max-[640px]:order-2" aria-labelledby="connect-title">
          <div className="connect-intro-copy">
            <span className="eyebrow">Self-hosted platform access</span>
            <h1 id="connect-title">Connect to your OmniWA runtime.</h1>
            <p>
              Enter the OmniWA GO origin and an API key. The console validates the key and detects
              its scope before creating a browser session.
            </p>
          </div>
          <div className="connect-intro-note">
            <span className="dot" style={{ background: 'var(--info)' }} />
            <p>Direct browser connection. No platform credentials pass through another service.</p>
          </div>
        </section>

        <section className="connect-panel max-[640px]:order-1" aria-labelledby="connection-form-title">
          <div className="connect-panel-head">
            <div>
              <span className="eyebrow !text-[var(--fg-2)]">Platform session</span>
              <h2 id="connection-form-title">Connection details</h2>
            </div>
          </div>

          <form className="connect-form" onSubmit={submit}>
            <ol className="connect-sequence max-[640px]:!hidden" aria-label="Connection checks">
              <li>
                <span className="connect-sequence-index num !text-[var(--fg-2)]">01</span>
                <strong>Validate origin</strong>
              </li>
              <li>
                <span className="connect-sequence-index num !text-[var(--fg-2)]">02</span>
                <strong>Verify key</strong>
              </li>
              <li>
                <span className="connect-sequence-index num !text-[var(--fg-2)]">03</span>
                <strong>Detect scope</strong>
              </li>
            </ol>

            <div className="connect-field">
              <div className="connect-label-row">
                <label htmlFor="connect-base-url">API base URL</label>
                <span className="!text-[var(--fg-2)]">Origin only</span>
              </div>
              <input
                ref={baseUrlInput}
                className="input"
                id="connect-base-url"
                name="baseUrl"
                type="url"
                value={baseUrl}
                required
                autoComplete="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={pending}
                aria-describedby={`connect-base-url-help${baseUrlError ? ' connect-base-url-error' : ''}`}
                aria-invalid={baseUrlError ? 'true' : undefined}
                onChange={(event) => setBaseUrl(event.target.value)}
              />
              <p id="connect-base-url-help">
                Enter the OmniWA GO API origin directly. Local development defaults to port 4000.
              </p>
              {baseUrlError && <p id="connect-base-url-error" className="help error" role="alert">{baseUrlError.message}</p>}
            </div>

            <div className="connect-field">
              <div className="connect-label-row">
                <label htmlFor="connect-api-key">API key</label>
                <button
                  className="connect-key-toggle"
                  type="button"
                  aria-controls="connect-api-key"
                  aria-pressed={showApiKey}
                  disabled={pending}
                  onClick={() => {
                    setShowApiKey((shown) => !shown);
                    apiKeyInput.current?.focus();
                  }}
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                ref={apiKeyInput}
                className="input"
                id="connect-api-key"
                name="apiKey"
                type={showApiKey ? 'text' : 'password'}
                placeholder="Paste API key"
                required
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={pending}
                aria-describedby="connect-api-key-help"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
              />
              <p id="connect-api-key-help">Never displayed again after entry.</p>
            </div>

            <SurfaceNotice
              kind="info"
              label="Session"
              title="Memory-only credential"
              detail="The API key is cleared on reload or sign-out and is never written to browser storage."
              className="connect-storage-warning"
            />

            {connectionError && (
              <SurfaceNotice
                kind="error"
                label={connectionError.category}
                title={connectionError.message}
                requestId={connectionError.requestId}
                className="connect-error"
                announcement="assertive"
              />
            )}

            <button
              className="btn primary connect-submit"
              type="submit"
              disabled={!canSubmit}
              aria-busy={pending ? 'true' : undefined}
            >
              {pending ? 'Connecting…' : 'Connect to OmniWA GO'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
