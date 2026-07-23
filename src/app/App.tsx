import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { ApiProvider } from '@/api/ApiProvider';
import { CapabilitiesProvider } from '@/api/CapabilitiesProvider';
import { ApiFailure } from '@/api/envelopes';
import { RealtimeProvider } from '@/api/RealtimeProvider';
import { clearSession, type ConsoleSession } from '@/lib/session';
import { FeedbackProvider, useFeedback } from '@/components/feedback/FeedbackProvider';
import { ActiveConnectPage, ActiveShell, authenticatedRoutes } from '@generation';

type ConnectNotice = 'session-invalid' | undefined;

const developmentRoutes = import.meta.env.DEV
  ? [{
      path: '/__ui-v2',
      lazy: async () => {
        const { UiV2Gallery } = await import('./UiV2Gallery');
        return { Component: UiV2Gallery };
      },
    }]
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
                  ...authenticatedRoutes,
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
