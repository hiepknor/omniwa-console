import createClient from 'openapi-fetch';
import type { ConsoleSession } from '@/lib/session';
import type { paths } from './generated/schema';

export type ApiClient = ReturnType<typeof createApiClient>;

/** Default omniwa-go dev origin (see docs/AUTH_AND_SESSION.md). */
export const DEFAULT_BASE_URL = 'http://localhost:8080';

/**
 * omniwa-go authenticates every request with the `apikey` header — either the
 * global admin key or a per-instance token (see docs/AUTH_AND_SESSION.md).
 */
export function createApiClient(session: Pick<ConsoleSession, 'baseUrl' | 'apiKey'>) {
  return createClient<paths>({
    baseUrl: session.baseUrl,
    headers: { apikey: session.apiKey },
  });
}
