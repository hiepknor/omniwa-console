import { useMemo } from 'react';
import type { ConsoleSession } from '@/lib/session';
import { useApi, useApiSession } from './ApiProvider';
import { createApiClient, type ApiClient, type CredentialScope } from './client';

export function instanceTokenCredentialScope(
  session: Pick<ConsoleSession, 'apiKey' | 'keyKind'>,
  token: string | undefined,
): CredentialScope {
  return token && session.keyKind === 'api' && token === session.apiKey ? 'session' : 'instance';
}

/**
 * Build an instance-scoped client without allowing the bearer token into a
 * query key, URL, log, or component-owned cache.
 */
export function useInstanceClient(token: string | undefined): ApiClient | undefined {
  const session = useApiSession();
  const sessionClient = useApi();
  return useMemo(
    () => {
      if (!token) return undefined;
      if (instanceTokenCredentialScope(session, token) === 'session') return sessionClient;
      return createApiClient({ baseUrl: session.baseUrl, apiKey: token }, 'instance');
    },
    [session, sessionClient, token],
  );
}
