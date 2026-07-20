import createClient from 'openapi-fetch';
import type { ConsoleSession } from '@/lib/session';
import type { paths } from './generated/schema';
import { isMockApiOrigin } from './mock/config';

export type ApiClient = ReturnType<typeof createApiClient>;

const developmentMockFetch: typeof fetch = async (input, init) => {
  const { mockFetch } = await import('./mock/transport');
  return mockFetch(input, init);
};

export function createApiClient(session: Pick<ConsoleSession, 'baseUrl' | 'apiKey'>) {
  return createClient<paths>({
    baseUrl: session.baseUrl,
    headers: { 'x-api-key': session.apiKey },
    ...(import.meta.env.DEV && isMockApiOrigin(session.baseUrl) ? { fetch: developmentMockFetch } : {}),
  });
}
