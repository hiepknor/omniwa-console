import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, useMemo, useRef, useState } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { ApiProvider } from '@/api/ApiProvider';
import { CapabilitiesProvider } from '@/api/CapabilitiesProvider';
import { ApiFailure } from '@/api/envelopes';
import { RealtimeProvider } from '@/api/RealtimeProvider';
import { clearSession, type ConsoleSession } from '@/lib/session';
import { UI_GENERATION } from '@/lib/ui-generation';
import { FeedbackProvider, useFeedback } from '@/components/feedback/FeedbackProvider';
import { ConnectPage } from './ConnectPage';
import { ConnectPageV2 } from './ConnectPageV2';
import { Shell } from './Shell';
import { ShellV2 } from './ShellV2';

type ConnectNotice = 'session-invalid' | undefined;

const ActiveConnectPage = UI_GENERATION === 'v2' ? ConnectPageV2 : ConnectPage;
const ActiveShell = UI_GENERATION === 'v2' ? ShellV2 : Shell;

const developmentRoutes = import.meta.env.DEV
  ? [{
      path: '/__ui-v2',
      lazy: async () => {
        const { UiV2Gallery } = await import('./UiV2Gallery');
        return { Component: UiV2Gallery };
      },
    }]
  : [];

const OverviewPage = lazy(() =>
  import('@/features/overview/OverviewPage').then((module) => ({ default: module.OverviewPage })),
);
const OverviewPageV2 = lazy(() =>
  import('@/features/platform-v2/OverviewPageV2').then((module) => ({ default: module.OverviewPageV2 })),
);
const RecoveryPageV2 = lazy(() =>
  import('@/features/platform-v2/RecoveryPageV2').then((module) => ({ default: module.RecoveryPageV2 })),
);
const ActiveOverviewPage = UI_GENERATION === 'v2' ? OverviewPageV2 : OverviewPage;
const InstancesPage = lazy(() =>
  import('@/features/instances/InstancesPage').then((module) => ({ default: module.InstancesPage })),
);
const InstancesPageV2 = lazy(() =>
  import('@/features/instances-v2/InstancesPageV2').then((module) => ({ default: module.InstancesPageV2 })),
);
const ActiveInstancesPage = UI_GENERATION === 'v2' ? InstancesPageV2 : InstancesPage;
const ChatsPage = lazy(() =>
  import('@/features/chats/ChatsPage').then((module) => ({ default: module.ChatsPage })),
);
const ConversationsPageV2 = lazy(() =>
  import('@/features/conversations-v2/ConversationsPageV2').then((module) => ({ default: module.ConversationsPageV2 })),
);
const GroupsPage = lazy(() =>
  import('@/features/groups/GroupsPage').then((module) => ({ default: module.GroupsPage })),
);
const GroupsPageV2 = lazy(() =>
  import('@/features/groups-v2/GroupsPageV2').then((module) => ({ default: module.GroupsPageV2 })),
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
const EventsPageV2 = lazy(() =>
  import('@/features/events-v2/EventsPageV2').then((module) => ({ default: module.EventsPageV2 })),
);
const CampaignsPage = lazy(() =>
  import('@/features/campaigns/CampaignsPage').then((module) => ({ default: module.CampaignsPage })),
);
const CampaignsPageV2 = lazy(() =>
  import('@/features/campaigns-v2/CampaignsPageV2').then((module) => ({ default: module.CampaignsPageV2 })),
);
const CreateCampaignV2 = lazy(() =>
  import('@/features/campaigns-v2/CreateCampaignV2').then((module) => ({ default: module.CreateCampaignV2 })),
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
  const [session, setSession] = useState<ConsoleSession | null>(() => {
    clearSession();
    return null;
  });
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
              ...developmentRoutes,
              {
                element: (
                  <ApiProvider session={session}>
                    <CapabilitiesProvider>
                      <RealtimeProvider
                        session={session}
                        onAuthError={() => disconnectRef.current('session-invalid')}
                      >
                        <ActiveShell session={session} onDisconnect={() => disconnectRef.current()} />
                      </RealtimeProvider>
                    </CapabilitiesProvider>
                  </ApiProvider>
                ),
                children: [
                  { path: '/connect', element: <Navigate to="/overview" replace /> },
                  { path: '/', element: <Navigate to="/overview" replace /> },
                  ...(UI_GENERATION === 'v2'
                    ? [
                        { path: '/chats', element: <ConversationsPageV2 /> },
                        { path: '/chats/:chatId', element: <ConversationsPageV2 /> },
                      ]
                    : [
                        { path: '/chats', element: <ChatsPage /> },
                        { path: '/chats/:instanceId', element: <ChatsPage /> },
                        { path: '/chats/:instanceId/:chatId', element: <ChatsPage /> },
                      ]),
                  ...(UI_GENERATION === 'v2'
                    ? [
                        { path: '/groups', element: <GroupsPageV2 /> },
                        { path: '/groups/:groupId', element: <GroupsPageV2 /> },
                      ]
                    : [
                        { path: '/groups', element: <GroupsPage /> },
                        { path: '/groups/:instanceId', element: <GroupsPage /> },
                      ]),
                  ...(UI_GENERATION === 'v2'
                    ? [
                        { path: '/messages', element: <CampaignsPageV2 /> },
                        { path: '/messages/new', element: <CreateCampaignV2 /> },
                        { path: '/messages/:campaignId', element: <CampaignsPageV2 /> },
                      ]
                    : [
                        { path: '/messages', element: <CampaignsPage /> },
                        { path: '/messages/new', element: <CampaignsPage /> },
                      ]),
                  { path: '/overview', element: <ActiveOverviewPage /> },
                  ...(UI_GENERATION === 'v2'
                    ? [{ path: '/recovery', element: <RecoveryPageV2 /> }]
                    : []),
                  { path: '/instances', element: <ActiveInstancesPage /> },
                  { path: '/instances/:instanceId', element: <ActiveInstancesPage /> },
                  { path: '/queue', element: <QueuePage /> },
                  { path: '/webhooks', element: <WebhooksPage /> },
                  { path: '/webhooks/:webhookId', element: <WebhooksPage /> },
                  { path: '/events', element: UI_GENERATION === 'v2' ? <EventsPageV2 /> : <EventsPage /> },
                  { path: '/settings', element: <SettingsPage /> },
                  { path: '/settings/api-keys', element: <ApiKeysPage /> },
                  { path: '*', element: <Navigate to="/overview" replace /> },
                ],
              },
            ]
          : [
              ...developmentRoutes,
              {
                path: '/connect',
                element: (
                  <ActiveConnectPage
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
