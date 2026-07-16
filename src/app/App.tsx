import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { ApiProvider } from '@/api/ApiProvider';
import { clearSession, loadSession, type ConsoleSession } from '@/lib/session';
import { ConnectPage } from './ConnectPage';
import { PanelStub } from './PanelStub';
import { Shell } from './Shell';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10_000 },
  },
});

export function App() {
  const [session, setSession] = useState<ConsoleSession | null>(() => loadSession());

  const disconnect = () => {
    clearSession();
    queryClient.clear();
    setSession(null);
  };

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
              { path: '/', element: <Navigate to="/overview" replace /> },
              { path: '/connect', element: <Navigate to="/overview" replace /> },
              { path: '/overview', element: <PanelStub panel="overview" /> },
              { path: '/instances', element: <PanelStub panel="instances" /> },
              { path: '/instances/:instanceId', element: <PanelStub panel="instances" /> },
              { path: '/instances/:instanceId/chats', element: <PanelStub panel="chats" /> },
              { path: '/instances/:instanceId/contacts', element: <PanelStub panel="contacts" /> },
              { path: '/instances/:instanceId/labels', element: <PanelStub panel="labels" /> },
              { path: '/instances/:instanceId/groups', element: <PanelStub panel="groups" /> },
              { path: '/instances/:instanceId/groups/:groupId', element: <PanelStub panel="groups" /> },
              { path: '/instances/:instanceId/messages', element: <PanelStub panel="messages" /> },
              { path: '/messages/:messageId', element: <PanelStub panel="messages" /> },
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
