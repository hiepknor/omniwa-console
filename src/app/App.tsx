import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, useMemo, useRef, useState } from 'react';
import { createBrowserRouter, Navigate, type RouteObject, RouterProvider, useLocation, useParams } from 'react-router-dom';
import { ApiProvider } from '@/api/ApiProvider';
import { CapabilitiesProvider } from '@/api/CapabilitiesProvider';
import { ApiFailure } from '@/api/envelopes';
import { RealtimeProvider } from '@/api/RealtimeProvider';
import { clearSession, type ConsoleSession } from '@/lib/session';
import { FeedbackProvider, useFeedback } from '@/components/feedback/FeedbackProvider';
import { ConnectPage } from './ConnectPage';
import { Shell } from './Shell';
import { shouldInvalidateSession } from './session-error';

const OverviewPage = lazy(() => import('@/features/platform/OverviewPage').then((m) => ({ default: m.OverviewPage })));
const RecoveryPage = lazy(() => import('@/features/platform/RecoveryPage').then((m) => ({ default: m.RecoveryPage })));
const InstancesPage = lazy(() => import('@/features/instances/InstancesPage').then((m) => ({ default: m.InstancesPage })));
const PairingPage = lazy(() => import('@/features/instances/PairingPage').then((m) => ({ default: m.PairingPage })));
const ConversationsPage = lazy(() => import('@/features/conversations/ConversationsPage').then((m) => ({ default: m.ConversationsPage })));
const GroupsPage = lazy(() => import('@/features/groups/GroupsPage').then((m) => ({ default: m.GroupsPage })));
const GroupListsPage = lazy(() => import('@/features/groups/GroupListsPage').then((m) => ({ default: m.GroupListsPage })));
const GroupListEditorPage = lazy(() => import('@/features/groups/GroupListEditorPage').then((m) => ({ default: m.GroupListEditorPage })));
const CampaignsPage = lazy(() => import('@/features/campaigns/CampaignsPage').then((m) => ({ default: m.CampaignsPage })));
const CreateCampaignPage = lazy(() => import('@/features/campaigns/CreateCampaign').then((m) => ({ default: m.CreateCampaign })));
const EventsPage = lazy(() => import('@/features/events/EventsPage').then((m) => ({ default: m.EventsPage })));

export function legacyChatsRedirectLocation(chatId: string | undefined, currentSearch: string): string {
  const search = new URLSearchParams(currentSearch);
  search.delete('cursor');
  search.delete('messageCursor');
  if (search.get('view') === 'chats') search.delete('view');
  const pathname = chatId ? `/conversations/${encodeURIComponent(chatId)}` : '/conversations';
  return `${pathname}${search.size ? `?${search.toString()}` : ''}`;
}

function LegacyChatsRedirect() {
  const { chatId } = useParams();
  const location = useLocation();
  return <Navigate to={legacyChatsRedirectLocation(chatId, location.search)} replace />;
}

export const authenticatedRoutes: RouteObject[] = [
  { path: '/conversations', element: <ConversationsPage /> },
  { path: '/conversations/:conversationRef', element: <ConversationsPage /> },
  { path: '/chats', element: <LegacyChatsRedirect /> },
  { path: '/chats/:chatId', element: <LegacyChatsRedirect /> },
  { path: '/groups', element: <GroupsPage /> },
  { path: '/groups/lists', element: <GroupListsPage /> },
  { path: '/groups/lists/new', element: <GroupListEditorPage /> },
  { path: '/groups/lists/:groupListId', element: <GroupListsPage /> },
  { path: '/groups/lists/:groupListId/edit', element: <GroupListEditorPage /> },
  { path: '/groups/:groupId', element: <GroupsPage /> },
  { path: '/campaigns', element: <CampaignsPage /> },
  { path: '/campaigns/new', element: <CreateCampaignPage /> },
  { path: '/campaigns/:campaignId', element: <CampaignsPage /> },
  { path: '/overview', element: <OverviewPage /> },
  { path: '/recovery', element: <RecoveryPage /> },
  { path: '/instances', element: <InstancesPage /> },
  { path: '/instances/:instanceId', element: <InstancesPage /> },
  { path: '/connection', element: <PairingPage /> },
  { path: '/events', element: <EventsPage /> },
  { path: '*', element: <Navigate to="/overview" replace /> },
];

type ConnectNotice = 'session-invalid' | undefined;

const developmentRoutes = import.meta.env.DEV
  ? [
      {
        path: '/__ui',
        lazy: async () => {
          const { UiGallery } = await import('./UiGallery');
          return { Component: UiGallery };
        },
      },
      {
        path: '/__preview/overview',
        lazy: async () => {
          const { PreviewOverview } = await import('./PreviewOverview');
          return { Component: PreviewOverview };
        },
      },
      {
        path: '/__preview/instances',
        lazy: async () => {
          const { PreviewInstances } = await import('./PreviewInstances');
          return { Component: PreviewInstances };
        },
      },
      {
        path: '/__preview/connection',
        lazy: async () => {
          const { PreviewConnection } = await import('./PreviewConnection');
          return { Component: PreviewConnection };
        },
      },
      {
        path: '/__preview/recovery',
        lazy: async () => {
          const { PreviewRecovery } = await import('./PreviewRecovery');
          return { Component: PreviewRecovery };
        },
      },
      {
        path: '/__preview/conversations',
        lazy: async () => {
          const { PreviewConversations } = await import('./PreviewConversations');
          return { Component: PreviewConversations };
        },
      },
      {
        path: '/__preview/groups',
        lazy: async () => {
          const { PreviewGroups } = await import('./PreviewGroups');
          return { Component: PreviewGroups };
        },
      },
      {
        path: '/__preview/campaigns',
        lazy: async () => {
          const { PreviewCampaigns } = await import('./PreviewCampaigns');
          return { Component: PreviewCampaigns };
        },
      },
      {
        path: '/__preview/events',
        lazy: async () => {
          const { PreviewEvents } = await import('./PreviewEvents');
          return { Component: PreviewEvents };
        },
      },
    ]
  : [];

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
          if (shouldInvalidateSession(error)) {
            disconnectRef.current('session-invalid');
          }
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
                        <Shell session={session} onDisconnect={() => disconnectRef.current()} />
                      </RealtimeProvider>
                    </CapabilitiesProvider>
                  </ApiProvider>
                ),
                children: [
                  { path: '/connect', element: <Navigate to="/overview" replace /> },
                  { path: '/', element: <Navigate to="/overview" replace /> },
                  ...authenticatedRoutes,
                ],
              },
            ]
          : [
              ...developmentRoutes,
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
