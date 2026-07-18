import { useQueryClient } from '@tanstack/react-query';
import { overviewKeys } from '@/api/keys';
import { PageHeader } from '@/components/PageHeader';
import { ActionRequiredList } from './ActionRequiredList';
import { EventTicker } from './EventTicker';
import { HealthStrip } from './HealthStrip';
import { MetricCards } from './MetricCards';

export function OverviewPage() {
  const queryClient = useQueryClient();

  const refresh = () => {
    for (const queryKey of overviewKeys) {
      void queryClient.invalidateQueries({ queryKey });
    }
  };

  return (
    <>
      <PageHeader
        title="Overview"
        actions={
          <>
            <span className="overview-refresh-cadence">Refreshes every <span className="num">15s</span></span>
            <button className="btn" type="button" onClick={refresh}>Refresh</button>
          </>
        }
      />
      <div className="overview-content">
        <HealthStrip />
        <MetricCards actionRequired={<ActionRequiredList />} />
        <EventTicker connectionState="disconnected" />
      </div>
    </>
  );
}
