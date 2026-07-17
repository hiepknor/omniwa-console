import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { ApiProvider } from '@/api/ApiProvider';
import { ApiFailure } from '@/api/envelopes';
import { OverviewPage } from '@/features/overview/OverviewPage';
import { InstancesPage } from '@/features/instances/InstancesPage';
import { clearSession, loadSession, type ConsoleSession } from '@/lib/session';
import { ConnectPage } from './ConnectPage';
import { PanelStub } from './PanelStub';
import { Shell } from './Shell';

export function App() {
  const [session, setSession] = useState<ConsoleSession | null>(() => loadSession());
  const disconnectRef = useRef<() => void>(() => undefined);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            if (error instanceof ApiFailure && error.category === 'authentication') {
              disconnectRef.current();
            }
          },
        }),
        defaultOptions: {
          queries: { retry: 1, staleTime: 10_000 },
        },
      }),
  );

  const disconnect = () => {
    clearSession();
    queryClient.clear();
    setSession(null);
  };
  disconnectRef.current = disconnect;

  const router = createBrowserRouter(
    session
      ? [
          {
            element: (
              <ApiProvider session={session}>
                <Shell session={session} onDisconnect={disconnect} />
              </ApiProvider>
            ),
            children: [
              { path: '/connect', element: <Navigate to="/overview" replace /> },
              { path: '/', element: <Navigate to="/overview" replace /> },
              { path: '/chats', element: <PanelStub panel="chats" /> },
              { path: '/chats/:instanceId', element: <PanelStub panel="chats" /> },
              { path: '/chats/:instanceId/:chatId', element: <PanelStub panel="chats" /> },
              { path: '/groups', element: <PanelStub panel="groups" /> },
              { path: '/groups/:instanceId', element: <PanelStub panel="groups" /> },
              { path: '/messages', element: <PanelStub panel="messages" /> },
              { path: '/messages/new', element: <PanelStub panel="messages" /> },
              { path: '/overview', element: <OverviewPage /> },
              { path: '/instances', element: <InstancesPage /> },
              { path: '/instances/:instanceId', element: <InstancesPage /> },
              { path: '/queue', element: <PanelStub panel="queue" /> },
              { path: '/webhooks', element: <PanelStub panel="webhooks" /> },
              { path: '/webhooks/:webhookId', element: <PanelStub panel="webhooks" /> },
              { path: '/events', element: <PanelStub panel="events" /> },
              { path: '/settings', element: <PanelStub panel="settings" /> },
              { path: '/settings/api-keys', element: <PanelStub panel="admin-keys" /> },
              { path: '*', element: <Navigate to="/overview" replace /> },
            ],
          },
        ]
      : [
          { path: '/connect', element: <ConnectPage onConnected={setSession} /> },
          { path: '*', element: <Navigate to="/connect" replace /> },
        ],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
