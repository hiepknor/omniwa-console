import { useIsFetching, useQueryClient, type Query } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { queryKeys } from '@/api/keys';
import { PageHeader } from '@/components/PageHeader';
import { SelectDropdown } from '@/components/SelectDropdown';
import { ActionRequiredState } from './ActionRequiredState';
import { EventTicker } from './EventTicker';
import { HealthStrip } from './HealthStrip';
import { MetricCards } from './MetricCards';

const overviewWindowOptions = [
  { value: '1h', label: 'Last hour', description: 'Recent message and event flow' },
  { value: '24h', label: 'Last 24 hours', description: 'Default operational window' },
  { value: '168h', label: 'Last 7 days', description: 'One-week flow history' },
  { value: '720h', label: 'Last 30 days', description: 'Maximum supported window' },
];

export function overviewWindowFromSearch(value: string | null): string {
  return value !== null && overviewWindowOptions.some((option) => option.value === value) ? value : '24h';
}

export function OverviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawWindow = searchParams.get('window');
  const window = overviewWindowFromSearch(rawWindow);
  const queryClient = useQueryClient();
  const activeKeys = [queryKeys.health, queryKeys.projectionHealth, queryKeys.overview(window)] as const;
  const fetchingCount = useIsFetching({
    predicate: (query: Query) => activeKeys.some((key) => (
      key.length === query.queryKey.length && key.every((part, index) => part === query.queryKey[index])
    )),
  });
  const refresh = () => {
    for (const queryKey of activeKeys) void queryClient.invalidateQueries({ queryKey });
  };
  const setWindow = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === '24h') next.delete('window'); else next.set('window', value);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (rawWindow === null || rawWindow === window) return;
    const next = new URLSearchParams(searchParams);
    next.delete('window');
    setSearchParams(next, { replace: true });
  }, [rawWindow, searchParams, setSearchParams, window]);

  return (
    <>
      <PageHeader
        title="Overview"
        meta={<span>Persisted operational state</span>}
        scope={<SelectDropdown label="Metric window" value={window} options={overviewWindowOptions} onChange={setWindow} />}
        actions={<><span className="overview-refresh-cadence" aria-live="polite">{fetchingCount > 0 ? <>Refreshing <span className="num">{fetchingCount}</span> reads</> : <>Refreshes every <span className="num">30s</span></>}</span><button className="btn" type="button" onClick={refresh}>Refresh</button></>}
      />
      <div className="overview-content">
        <HealthStrip />
        <MetricCards window={window} />
        <ActionRequiredState />
        <EventTicker connectionState="polling" />
      </div>
    </>
  );
}
