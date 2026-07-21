import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createApiClient, type ApiClient } from './client';
import type { ConsoleSession } from '@/lib/session';

const ApiContext = createContext<ApiClient | null>(null);
const SessionContext = createContext<ConsoleSession | null>(null);

export function ApiProvider({
  session,
  children,
}: {
  session: ConsoleSession;
  children: ReactNode;
}) {
  const client = useMemo(
    () => createApiClient(session),
    [session.baseUrl, session.apiKey],
  );
  return (
    <SessionContext.Provider value={session}>
      <ApiContext.Provider value={client}>{children}</ApiContext.Provider>
    </SessionContext.Provider>
  );
}

export function useApi(): ApiClient {
  const client = useContext(ApiContext);
  if (!client) throw new Error('useApi must be used inside ApiProvider (authenticated shell)');
  return client;
}

/**
 * The active session. Needed to build per-instance clients: omniwa-go's
 * token-scoped routes (`/instance/connect·qr·status·disconnect·reconnect`) act on
 * the instance whose token is in the `apikey` header, not a path param, so the
 * console builds a client from each instance's own token.
 */
export function useApiSession(): ConsoleSession {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useApiSession must be used inside ApiProvider (authenticated shell)');
  return session;
}
