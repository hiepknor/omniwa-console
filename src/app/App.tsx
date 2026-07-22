import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, useMemo, useRef, useState } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { ApiProvider } from '@/api/ApiProvider';
import { CapabilitiesProvider } from '@/api/CapabilitiesProvider';
import { ApiFailure } from '@/api/envelopes';
import { RealtimeProvider } from '@/api/RealtimeProvider';
import { clearSession, loadSession, type ConsoleSession } from '@/lib/session';
import { FeedbackProvider, useFeedback } from '@/components/feedback/FeedbackProvider';
import { ConnectPage } from './ConnectPage';
import { PanelStub } from './PanelStub';
import { Shell } from './Shell';

type ConnectNotice = 'session-invalid' | undefined;

const OverviewPage = lazy(() =>
  import('@/features/overview/OverviewPage').then((module) => ({ default: module.OverviewPage })),
);
const InstancesPage = lazy(() =>
  import('@/features/instances/InstancesPage').then((module) => ({ default: module.InstancesPage })),
);
const ChatsPage = lazy(() =>
  import('@/features/chats/ChatsPage').then((module) => ({ default: module.ChatsPage })),
);
const GroupsPage = lazy(() =>
  import('@/features/groups/GroupsPage').then((module) => ({ default: module.GroupsPage })),
);
const QueuePage = lazy(() =>
  import('@/features/queue/QueuePage').then((module) => ({ default: module.QueuePage })),
);
const WebhooksPage = lazy(() =>
  import('@/features/webhooks/WebhooksPage').then((module) => ({ default: module.WebhooksPage })),
);
const EventsPage = lazy(() =>
  import('@/features/events/EventsPage').then((module) => ({ default: module.EventsPage })),
);
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })),
);
const ApiKeysPage = lazy(() =>
  import('@/features/api-keys/ApiKeysPage').then((module) => ({ default: module.ApiKeysPage })),
);

function AppRuntime() {
  const feedback = useFeedback();
  const feedbackRef = useRef(feedback);
  feedbackRef.current = feedback;
  const [session, setSession] = useState<ConsoleSession | null>(() => loadSession());
  const [connectNotice, setConnectNotice] = useState<ConnectNotice>();
  const connectNoticeRef = useRef(connectNotice);
  connectNoticeRef.current = connectNotice;
  const disconnectRef = useRef<(notice?: ConnectNotice) => void>(() => undefined);
  const onConnectedRef = useRef<(nextSession: ConsoleSession) => void>(() => undefined);
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
          queries: {
            // Never auto-retry permanent or rate-limited failures (retrying a
            // WhatsApp throttle deepens it); allow one retry for transient 5xx only.
            retry: (failureCount, error) => {
              if (error instanceof ApiFailure) {
                if (error.category === 'rate_limited' || !error.retryable) return false;
              }
              return failureCount < 1;
            },
            staleTime: 10_000,
            // Avoid a refetch storm (incl. WhatsApp-live reads) on every tab focus.
            refetchOnWindowFocus: false,
          },
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
  onConnectedRef.current = (nextSession) => {
    setConnectNotice(undefined);
    feedbackRef.current.reportTransportSuccess();
    setSession(nextSession);
  };

  const router = useMemo(
    () =>
      createBrowserRouter(
        session
          ? [
              {
                element: (
                  <ApiProvider session={session}>
                    <CapabilitiesProvider>
                      <RealtimeProvider
                        session={session}
                        onAuthError={() => disconnectRef.current('session-invalid')}
                      >
                        <Shell session={session} onDisconnect={() => disconnectRef.current()} />
                      </RealtimeProvider>
                    </CapabilitiesProvider>
                  </ApiProvider>
                ),
                children: [
                  { path: '/connect', element: <Navigate to="/overview" replace /> },
                  { path: '/', element: <Navigate to="/overview" replace /> },
                  { path: '/chats', element: <ChatsPage /> },
                  { path: '/chats/:instanceId', element: <ChatsPage /> },
                  { path: '/chats/:instanceId/:chatId', element: <ChatsPage /> },
                  { path: '/groups', element: <GroupsPage /> },
                  { path: '/groups/:instanceId', element: <GroupsPage /> },
                  { path: '/messages', element: <PanelStub panel="messages" /> },
                  { path: '/messages/new', element: <PanelStub panel="messages" /> },
                  { path: '/overview', element: <OverviewPage /> },
                  { path: '/instances', element: <InstancesPage /> },
                  { path: '/instances/:instanceId', element: <InstancesPage /> },
                  { path: '/queue', element: <QueuePage /> },
                  { path: '/webhooks', element: <WebhooksPage /> },
                  { path: '/webhooks/:webhookId', element: <WebhooksPage /> },
                  { path: '/events', element: <EventsPage /> },
                  { path: '/settings', element: <SettingsPage /> },
                  { path: '/settings/api-keys', element: <ApiKeysPage /> },
                  { path: '*', element: <Navigate to="/overview" replace /> },
                ],
              },
            ]
          : [
              {
                path: '/connect',
                element: (
                  <ConnectPage
                    notice={connectNoticeRef.current}
                    onConnected={(nextSession) => onConnectedRef.current(nextSession)}
                  />
                ),
              },
              { path: '*', element: <Navigate to="/connect" replace /> },
            ],
      ),
    [session],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </QueryClientProvider>
  );
}

export function App() {
  return <FeedbackProvider><AppRuntime /></FeedbackProvider>;
}
