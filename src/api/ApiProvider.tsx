import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createApiClient, type ApiClient } from './client';
import type { ConsoleSession } from '@/lib/session';

const ApiContext = createContext<ApiClient | null>(null);

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
  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

export function useApi(): ApiClient {
  const client = useContext(ApiContext);
  if (!client) throw new Error('useApi must be used inside ApiProvider (authenticated shell)');
  return client;
}
