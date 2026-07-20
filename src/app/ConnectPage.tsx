import { useRef, useState, type FormEvent } from 'react';
import { createApiClient } from '@/api/client';
import { ApiFailure, unwrap } from '@/api/envelopes';
import { MOCK_API_KEY, MOCK_API_ORIGIN } from '@/api/mock/config';
import { SurfaceNotice } from '@/components/feedback/SurfaceNotice';
import { useDocumentTitle } from '@/components/useDocumentTitle';
import { saveSession, type ConsoleSession, type KeyKind } from '@/lib/session';

const DEFAULT_BASE_URL = import.meta.env.DEV ? window.location.origin : 'http://localhost:3000';

type ConnectError = {
  category: string;
  message: string;
  requestId?: string;
};

async function detectKeyKind(client: ReturnType<typeof createApiClient>): Promise<KeyKind> {
  try {
    unwrap(await client.GET('/v1/api-keys'));
    return 'admin';
  } catch (error) {
    if (error instanceof ApiFailure && error.category === 'authorization') return 'api';
    return 'unknown';
  }
}

function isValidOrigin(value: string) {
  try {
    const url = new URL(value);
    return url.origin === value.replace(/\/$/, '');
  } catch {
    return false;
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
  const [remember, setRemember] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ConnectError | null>(null);
  const baseUrlInput = useRef<HTMLInputElement>(null);
  const apiKeyInput = useRef<HTMLInputElement>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isValidOrigin(baseUrl)) {
      setError({
        category: 'validation',
        message: 'API base URL must be a valid URL, e.g. http://localhost:3000',
      });
      baseUrlInput.current?.focus();
      return;
    }

    const origin = new URL(baseUrl).origin;
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
        setError({ category: err.category, message: err.message, requestId: err.requestId });
      } else {
        setError({
          category: 'network',
          message: 'Could not reach the OmniWA API at that address.',
        });
      }
    } finally {
      setPending(false);
    }
  };

  const openMockWorkspace = () => {
    const session: ConsoleSession = {
      baseUrl: MOCK_API_ORIGIN,
      apiKey: MOCK_API_KEY,
      keyKind: 'admin',
      connectedAt: new Date().toISOString(),
    };
    saveSession(session, false);
    onConnected(session);
  };

  const canSubmit = isValidOrigin(baseUrl) && apiKey.trim().length > 0 && !pending;
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
              Enter the platform origin and an API key. The console verifies health before creating
              a browser session.
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
                <strong>Probe health</strong>
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
                aria-describedby={`connect-base-url-help${baseUrlError ? ' connect-base-url-error' : ''}`}
                aria-invalid={baseUrlError ? 'true' : undefined}
                onChange={(event) => setBaseUrl(event.target.value)}
              />
              <p id="connect-base-url-help">
                In local development, use the console origin to route requests through the Vite
                proxy.
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
                aria-describedby="connect-api-key-help"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
              />
              <p id="connect-api-key-help">Never displayed again after entry.</p>
            </div>

            <label className="connect-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>
                <strong>Remember on this device</strong>
                <small>Unchecked sessions end when this tab closes.</small>
              </span>
            </label>

            {remember && (
              <SurfaceNotice
                kind="warning"
                label="Storage"
                title="Persistent browser storage"
                detail="This stores the API key in this browser. Use only on a trusted device."
                className="connect-storage-warning"
              />
            )}

            {connectionError && (
              <SurfaceNotice
                kind="error"
                label={connectionError.category}
                title={connectionError.message}
                requestId={connectionError.requestId}
                showMissingRequestId
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
              {pending ? 'Connecting…' : 'Connect to platform'}
            </button>
          </form>
          {import.meta.env.DEV && (
            <footer className="flex min-h-[72px] items-center justify-between gap-4 border-t border-[var(--border-subtle)] bg-[var(--recessed)] !px-4 !py-3 max-[640px]:grid max-[640px]:grid-cols-1 max-[640px]:gap-3">
              <div className="grid min-w-0 gap-0.5">
                <span className="text-[9px] uppercase leading-[13px] tracking-[1.5px] text-[var(--muted)]">Development preview</span>
                <p className="text-[11px] leading-4 text-[var(--fg-2)]">Open deterministic fixtures without contacting the platform.</p>
              </div>
              <button className="btn min-h-10 shrink-0 !justify-center max-[640px]:min-h-11 max-[640px]:!w-full" type="button" onClick={openMockWorkspace}>Open mock workspace</button>
            </footer>
          )}
        </section>
      </div>
    </main>
  );
}
