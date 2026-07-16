import createClient from 'openapi-fetch';
import type { ConsoleSession } from '@/lib/session';
import type { paths } from './generated/schema';

export type ApiClient = ReturnType<typeof createApiClient>;

export function createApiClient(session: Pick<ConsoleSession, 'baseUrl' | 'apiKey'>) {
  return createClient<paths>({
    baseUrl: session.baseUrl,
    headers: { 'x-api-key': session.apiKey },
  });
}
