import { useIsFetching, useQueryClient, type Query } from '@tanstack/react-query';
import { overviewKeys } from '@/api/keys';
import { useRealtimeEvents, useRealtimeStatus } from '@/api/RealtimeProvider';
import { PageHeader } from '@/components/PageHeader';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { ActionRequiredList } from './ActionRequiredList';
import { EventTicker } from './EventTicker';
import { HealthStrip } from './HealthStrip';
import { MetricCards } from './MetricCards';

export function OverviewPage() {
  const queryClient = useQueryClient();
  const status = useRealtimeStatus();
  const realtimeEvents = useRealtimeEvents();
  const { transport } = useFeedback();
  const fetchingCount = useIsFetching({
    predicate: (query: Query) => overviewKeys.some((key) => (
      key.length === query.queryKey.length && key.every((part, index) => part === query.queryKey[index])
    )),
  });

  const refresh = () => {
    for (const queryKey of overviewKeys) {
      void queryClient.invalidateQueries({ queryKey });
    }
  };

  const events = realtimeEvents.map((event) => ({
    id: event.id,
    type: event.type,
    resourceId: event.resourceId,
    updatedAt: event.occurredAt,
  }));
  const connectionState = transport.status === 'offline'
    ? 'error'
    : status === 'live'
      ? 'connected'
      : status === 'polling'
        ? 'disconnected'
        : 'connecting';

  return (
    <>
      <PageHeader
        title="Overview"
        actions={
          <>
            <span className="overview-refresh-cadence" aria-live="polite">
              {fetchingCount > 0
                ? <>Refreshing <span className="num">{fetchingCount}</span> reads</>
                : status === 'live' && transport.status !== 'offline'
                  ? null
                  : <>Refreshes every <span className="num">15s</span></>}
            </span>
            <button className="btn" type="button" onClick={refresh}>Refresh</button>
          </>
        }
      />
      <div className="overview-content">
        <HealthStrip />
        <MetricCards actionRequired={<ActionRequiredList />} />
        <EventTicker events={events} connectionState={connectionState} />
      </div>
    </>
  );
}
