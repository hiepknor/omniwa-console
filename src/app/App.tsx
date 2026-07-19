import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { ApiProvider } from '@/api/ApiProvider';
import { ApiFailure } from '@/api/envelopes';
import { RealtimeProvider } from '@/api/RealtimeProvider';
import { OverviewPage } from '@/features/overview/OverviewPage';
import { InstancesPage } from '@/features/instances/InstancesPage';
import { ChatsPage } from '@/features/chats/ChatsPage';
import { QueuePage } from '@/features/queue/QueuePage';
import { WebhooksPage } from '@/features/webhooks/WebhooksPage';
import { EventsPage } from '@/features/events/EventsPage';
import { clearSession, loadSession, type ConsoleSession } from '@/lib/session';
import { FeedbackProvider, useFeedback } from '@/components/feedback/FeedbackProvider';
import { ConnectPage } from './ConnectPage';
import { PanelStub } from './PanelStub';
import { Shell } from './Shell';

type ConnectNotice = 'session-invalid' | undefined;

function AppRuntime() {
  const feedback = useFeedback();
  const feedbackRef = useRef(feedback);
  feedbackRef.current = feedback;
  const [session, setSession] = useState<ConsoleSession | null>(() => loadSession());
  const [connectNotice, setConnectNotice] = useState<ConnectNotice>();
  const disconnectRef = useRef<(notice?: ConnectNotice) => void>(() => undefined);
  const [queryClient] = useState(
    () => {
      const handleSuccess = () => feedbackRef.current.reportTransportSuccess();
      const handleError = (error: Error) => {
        if (error instanceof ApiFailure) {
          feedbackRef.current.reportTransportSuccess();
          if (error.category === 'authentication') disconnectRef.current('session-invalid');
          return;
        }
        feedbackRef.current.reportTransportFailure(error);
      };
      return new QueryClient({
        queryCache: new QueryCache({
          onError: handleError,
          onSuccess: handleSuccess,
        }),
        mutationCache: new MutationCache({ onError: handleError, onSuccess: handleSuccess }),
        defaultOptions: {
          queries: { retry: 1, staleTime: 10_000 },
        },
      });
    },
  );

  const disconnect = (notice?: ConnectNotice) => {
    clearSession();
    queryClient.clear();
    setConnectNotice(notice);
    setSession(null);
  };
  disconnectRef.current = disconnect;

  const router = createBrowserRouter(
    session
      ? [
          {
            element: (
              <ApiProvider session={session}>
                <RealtimeProvider
                  session={session}
                  onAuthError={() => disconnectRef.current('session-invalid')}
                >
                  <Shell session={session} onDisconnect={disconnect} />
                </RealtimeProvider>
              </ApiProvider>
            ),
            children: [
              { path: '/connect', element: <Navigate to="/overview" replace /> },
              { path: '/', element: <Navigate to="/overview" replace /> },
              { path: '/chats', element: <ChatsPage /> },
              { path: '/chats/:instanceId', element: <ChatsPage /> },
              { path: '/chats/:instanceId/:chatId', element: <ChatsPage /> },
              { path: '/groups', element: <PanelStub panel="groups" /> },
              { path: '/groups/:instanceId', element: <PanelStub panel="groups" /> },
              { path: '/messages', element: <PanelStub panel="messages" /> },
              { path: '/messages/new', element: <PanelStub panel="messages" /> },
              { path: '/overview', element: <OverviewPage /> },
              { path: '/instances', element: <InstancesPage /> },
              { path: '/instances/:instanceId', element: <InstancesPage /> },
              { path: '/queue', element: <QueuePage /> },
              { path: '/webhooks', element: <WebhooksPage /> },
              { path: '/webhooks/:webhookId', element: <WebhooksPage /> },
              { path: '/events', element: <EventsPage /> },
              { path: '/settings', element: <PanelStub panel="settings" /> },
              { path: '/settings/api-keys', element: <PanelStub panel="admin-keys" /> },
              { path: '*', element: <Navigate to="/overview" replace /> },
            ],
          },
        ]
      : [
          {
            path: '/connect',
            element: (
              <ConnectPage
                notice={connectNotice}
                onConnected={(nextSession) => {
                  setConnectNotice(undefined);
                  feedback.reportTransportSuccess();
                  setSession(nextSession);
                }}
              />
            ),
          },
          { path: '*', element: <Navigate to="/connect" replace /> },
        ],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export function App() {
  return <FeedbackProvider><AppRuntime /></FeedbackProvider>;
}
