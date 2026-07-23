import { useIsFetching, useQueryClient, type Query } from '@tanstack/react-query';
import { overviewKeys } from '@/api/keys';
import { PageHeader } from '@/components/PageHeader';
import { HealthStrip } from './HealthStrip';
import { MetricCards } from './MetricCards';

export function OverviewPage() {
  const queryClient = useQueryClient();
  const fetchingCount = useIsFetching({
    predicate: (query: Query) => overviewKeys.some((key) => (
      key.length === query.queryKey.length && key.every((part, index) => part === query.queryKey[index])
    )),
  });
  const refresh = () => {
    for (const queryKey of overviewKeys) void queryClient.invalidateQueries({ queryKey });
  };

  return (
    <>
      <PageHeader
        title="Overview"
        meta={<span>Persisted operational state</span>}
        actions={<><span className="overview-refresh-cadence" aria-live="polite">{fetchingCount > 0 ? <>Refreshing <span className="num">{fetchingCount}</span> reads</> : <>Refreshes every <span className="num">30s</span></>}</span><button className="btn" type="button" onClick={refresh}>Refresh</button></>}
      />
      <div className="overview-content">
        <HealthStrip />
        <MetricCards />
      </div>
    </>
  );
}
