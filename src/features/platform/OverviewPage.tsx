import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { queryKeys } from '@/api/keys';
import { ApiFailureNotice } from '@/components/ApiFailureNotice';
import { useResilientReadState } from '@/lib/query-state';
import { updateSearchParams } from '@/lib/url-search-state';
import { usePlatformHealth, usePlatformOverview, usePlatformProjectionHealth } from './hooks';
import { overviewWindowFromSearch, overviewWindowOptions } from './route-state';
import { OverviewView } from './OverviewView';

function QueryNotice({ label, query, state }: { label: string; query: { error: unknown; refetch: () => unknown }; state: ReturnType<typeof useResilientReadState> }) {
  if (!state.isError) return null;
  return <ApiFailureNotice error={state.error} title={`${label} read failed`} onRetry={() => query.refetch()} />;
}

export function OverviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const window = overviewWindowFromSearch(searchParams.get('window'));
  const overview = usePlatformOverview(window);
  const health = usePlatformHealth();
  const projection = usePlatformProjectionHealth();
  const overviewState = useResilientReadState(overview);
  const healthState = useResilientReadState(health);
  const projectionState = useResilientReadState(projection);
  const queryClient = useQueryClient();
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const recoveryAvailable = capabilities.data?.capabilities.includes('projection_failure_operations') ?? false;
  const refreshing = overview.isFetching || health.isFetching || projection.isFetching;

  const onWindowChange = (value: string) => {
    setSearchParams(updateSearchParams(searchParams, { window: value === '24h' ? undefined : value }), { replace: true });
  };
  const onRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.overview(window) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.health });
    void queryClient.invalidateQueries({ queryKey: queryKeys.projectionHealth });
  };

  const recovery = capabilities.isPending
    ? ('pending' as const)
    : session.keyKind === 'admin' && recoveryAvailable
      ? ('available' as const)
      : ('unsupported' as const);

  return (
    <OverviewView
      window={window}
      windowOptions={overviewWindowOptions.map((o) => ({ value: o.value, label: o.label }))}
      onWindowChange={onWindowChange}
      onRefresh={onRefresh}
      refreshing={refreshing}
      initialLoading={healthState.isInitialLoading || overviewState.isInitialLoading || projectionState.isInitialLoading}
      notices={
        <div className="grid gap-2">
          {capabilities.isError ? <ApiFailureNotice error={capabilities.error} title={capabilities.data ? 'Showing last known capabilities' : 'Capability discovery failed'} onRetry={() => capabilities.refetch()} /> : null}
          <QueryNotice label="Health" query={health} state={healthState} />
          <QueryNotice label="Overview" query={overview} state={overviewState} />
          <QueryNotice label="Projection" query={projection} state={projectionState} />
        </div>
      }
      health={health.data}
      overview={overview.data}
      projection={projection.data}
      recovery={capabilities.isError && !capabilities.data ? 'error' : recovery}
    />
  );
}
