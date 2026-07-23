import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { createApiClient, type ApiClient } from './client';
import type { ConsoleSession } from '@/lib/session';

const ApiContext = createContext<ApiClient | null>(null);
const SessionContext = createContext<ConsoleSession | null>(null);
const InstanceCredentialsContext = createContext<{
  credentials: Readonly<Record<string, string>>;
  setCredential: (instanceId: string, token: string | undefined) => void;
} | null>(null);

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
  const [credentials, setCredentials] = useState<Readonly<Record<string, string>>>({});
  const setCredential = useCallback((instanceId: string, token: string | undefined) => {
    setCredentials((current) => {
      const next = { ...current };
      if (token) next[instanceId] = token;
      else delete next[instanceId];
      return next;
    });
  }, []);
  return (
    <SessionContext.Provider value={session}>
      <ApiContext.Provider value={client}>
        <InstanceCredentialsContext.Provider value={{ credentials, setCredential }}>
          {children}
        </InstanceCredentialsContext.Provider>
      </ApiContext.Provider>
    </SessionContext.Provider>
  );
}

/** In-memory only credentials captured from one-time create/rotation responses. */
export function useInstanceCredential(instanceId: string | undefined): string | undefined {
  const context = useContext(InstanceCredentialsContext);
  if (!context) throw new Error('useInstanceCredential must be used inside ApiProvider');
  return instanceId ? context.credentials[instanceId] : undefined;
}

export function useSetInstanceCredential(): (instanceId: string, token: string | undefined) => void {
  const context = useContext(InstanceCredentialsContext);
  if (!context) throw new Error('useSetInstanceCredential must be used inside ApiProvider');
  return context.setCredential;
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
