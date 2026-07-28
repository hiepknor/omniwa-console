import { useRef, useState, type FormEvent } from 'react';
import { getCapabilities } from '@/api/capabilities';
import { createApiClient, DEFAULT_BASE_URL } from '@/api/client';
import { ApiFailure } from '@/api/envelopes';
import type { ConsoleSession, KeyKind } from '@/lib/session';

type ConnectError = { category: string; message: string; detail?: string; diagnostic?: string; requestId?: string };

export const CONNECT_TIMEOUT_MS = 15_000;
export type ConnectProbeStage = 'verify-key' | 'detect-scope';
export type CredentialDiscovery = { keyKind: KeyKind; instanceId?: string };

export async function probeKey(client: ReturnType<typeof createApiClient>, signal?: AbortSignal, onStage?: (stage: ConnectProbeStage) => void): Promise<CredentialDiscovery> {
  onStage?.('verify-key');
  const capabilities = await getCapabilities(client, signal);
  if (capabilities.credentialScope === 'admin') return { keyKind: 'admin' };
  if (capabilities.credentialScope === 'instance') {
    return { keyKind: 'api', ...(capabilities.instanceId ? { instanceId: capabilities.instanceId } : {}) };
  }

  // Compatibility only: older revisions omit credentialScope. These probes
  // remain sequential, and 401 is always an authentication failure.
  onStage?.('detect-scope');
  const admin = await client.GET('/instance/all', { signal });
  if (admin.data !== undefined) return { keyKind: 'admin' };
  if (admin.response.status !== 403) throw new ApiFailure(admin.error, admin.response.status, admin.response.headers);
  const scoped = await client.GET('/instance/status', { signal });
  if (scoped.data !== undefined) return { keyKind: 'api' };
  throw new ApiFailure(scoped.error, scoped.response.status, scoped.response.headers);
}

export function connectErrorForFailure(error: ApiFailure): ConnectError {
  const diagnostic = error.code ?? error.category;
  if (error.category === 'authentication') return { category: error.category, message: 'Authentication failed', detail: 'The API did not authorize this key. Verify the API origin and credential, then try again.', diagnostic, requestId: error.requestId };
  if (error.category === 'authorization') return { category: error.category, message: 'Access denied', detail: 'This key does not have access to the requested runtime scope.', diagnostic, requestId: error.requestId };
  return { category: error.category, message: error.message, diagnostic, requestId: error.requestId };
}

export function normalizeApiOrigin(value: string): string | undefined {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return undefined;
    return url.origin;
  } catch { return undefined; }
}

export function useConnectFlow(onConnected: (session: ConsoleSession) => void) {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [pending, setPending] = useState(false);
  const [probeStage, setProbeStage] = useState<ConnectProbeStage>();
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
      setError({ category: 'validation', message: 'API base URL must be an HTTP(S) origin, e.g. http://localhost:4000' });
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
      const credential = await probeKey(client, controller.signal, setProbeStage);
      onConnected({ baseUrl: origin, apiKey: normalizedKey, ...credential, connectedAt: new Date().toISOString() });
    } catch (caught) {
      if (controller.signal.aborted) setError({ category: 'timeout', diagnostic: 'timeout', message: 'The OmniWA API did not respond within 15 seconds.' });
      else if (caught instanceof ApiFailure) setError(connectErrorForFailure(caught));
      else setError({ category: 'network', diagnostic: 'network', message: 'Could not reach the OmniWA API at that address.' });
    } finally {
      window.clearTimeout(timeoutId);
      pendingRef.current = false;
      setProbeStage(undefined);
      setPending(false);
    }
  };

  return { apiKey, apiKeyInput, baseUrl, baseUrlInput, baseUrlError: error?.category === 'validation' ? error : undefined, canSubmit: baseUrl.trim().length > 0 && apiKey.trim().length > 0 && !pending, connectionError: error?.category !== 'validation' ? error : undefined, pending, probeStage, setApiKey, setBaseUrl, setShowApiKey, showApiKey, submit };
}
