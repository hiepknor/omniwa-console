import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { useResilientReadState } from '@/lib/query-state';
import { omitSearchParams, updateSearchParams, withSearchParams } from '@/lib/url-search-state';
import { Drawer, PageHeader, StateNotice } from '@/ui';
import { CreateInstance } from './CreateInstance';
import { CredentialHealth } from './CredentialHealth';
import { useCreateInstance, useInstance, useInstances } from './hooks';
import { InstancesView } from './InstancesView';
import { InstanceWorkspace } from './InstanceWorkspace';
import { filterInstances, instanceFiltersFromSearch } from './route-state';
import { FailureNotice } from './ui';
import { fleetReadMode } from './fleet-readiness';

function Blocked({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader eyebrow="Platform" title="Instances" description="Fleet metadata, pairing, lifecycle, settings, and credential posture." />
      <StateNotice kind="empty" title={title} detail={detail} />
    </div>
  );
}

export function InstancesPage() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const metadataAvailable = capabilities.data?.capabilities.includes('instance_metadata_views') ?? false;
  const readMode = fleetReadMode({
    keyKind: session.keyKind,
    capabilitiesPending: capabilities.isPending,
    capabilitiesError: capabilities.isError,
    capabilitiesAvailable: capabilities.data !== undefined,
    metadataAvailable,
  });
  const enabled = readMode === 'metadata' || readMode === 'compatibility';
  const { instanceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const list = useInstances(enabled, readMode === 'metadata');
  const detail = useInstance(instanceId, enabled, readMode === 'metadata');
  const create = useCreateInstance();
  const state = useResilientReadState(list, list.data?.resource !== undefined);
  const [destroyAck, setDestroyAck] = useState(false);
  const filters = instanceFiltersFromSearch(searchParams);
  const search = filters.search;
  const status = filters.status ?? '';
  const createOpen = searchParams.get('create') === '1';
  const instances = useMemo(() => list.data?.resource?.items ?? [], [list.data]);
  const filtered = useMemo(() => filterInstances(instances, filters), [instances, filters]);

  const setParam = (key: string, value?: string) => {
    setSearchParams(updateSearchParams(searchParams, { [key]: value }), { replace: true });
  };
  const routeParams = omitSearchParams(searchParams, ['create']);
  const listUrl = withSearchParams('/instances', routeParams);
  const openInstance = (id: string) => navigate(withSearchParams(`/instances/${encodeURIComponent(id)}`, routeParams));
  const closeCreate = () => { create.reset(); setParam('create'); };

  if (readMode === 'scope-blocked') return <Blocked title="Admin credential required" detail="Instance fleet management requires an admin credential. No fleet request was sent." />;
  if (readMode === 'discovering') return <Blocked title="Discovering capabilities" detail="Waiting for capability discovery before choosing the credential-safe fleet endpoint." />;
  if (readMode === 'capability-error') return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader eyebrow="Platform" title="Instances" description="Fleet metadata, pairing, lifecycle, settings, and credential posture." />
      <FailureNotice error={capabilities.error} onRetry={() => capabilities.refetch()} />
    </div>
  );

  return (
    <>
      {destroyAck ? (
        <div className="px-6 pt-6 max-sm:px-4">
          <StateNotice kind="info" title="Destroy accepted" detail="The refreshed metadata list remains authoritative." />
        </div>
      ) : null}

      {capabilities.isError && capabilities.data ? (
        <div className="px-6 pt-6 max-sm:px-4">
          <FailureNotice error={capabilities.error} stale onRetry={() => capabilities.refetch()} />
        </div>
      ) : null}

      <InstancesView
        search={search}
        status={status}
        onSearch={(v) => setParam('search', v)}
        onStatus={(v) => setParam('status', v || undefined)}
        onRefresh={() => list.refetch()}
        refreshing={list.isFetching}
        onNew={() => { create.reset(); setParam('create', '1'); }}
        instances={filtered}
        totalLoaded={instances.length}
        selectedId={instanceId}
        onOpen={openInstance}
        initialLoading={state.isInitialLoading}
        error={state.isError ? <FailureNotice error={state.error} stale={state.isStaleError} onRetry={() => list.refetch()} /> : undefined}
        emptyAll={Boolean(list.data) && instances.length === 0}
        emptyFiltered={instances.length > 0 && filtered.length === 0}
        credentialHealth={
          <div className="grid gap-3">
            {readMode === 'compatibility' ? <StateNotice kind="info" title="Compatibility fleet read" detail="instance_metadata_views is not advertised. Console is using the compatibility admin list/detail adapter and strips credential fields before they enter view models or query caches." /> : null}
            <CredentialHealth />
          </div>
        }
      />

      {instanceId ? (
        detail.data?.resource ? (
          <InstanceWorkspace
            instance={detail.data.resource}
            refreshError={detail.error}
            onRetry={() => detail.refetch()}
            onClose={() => navigate(listUrl)}
            onDestroyed={() => { setDestroyAck(true); navigate(listUrl); }}
          />
        ) : (
          <Drawer open onClose={() => navigate(listUrl)} title="Instance details" subtitle={instanceId}>
            {detail.isPending ? (
              <StateNotice kind="loading" title="Loading instance" />
            ) : detail.error ? (
              <FailureNotice error={detail.error} onRetry={() => detail.refetch()} />
            ) : (
              <StateNotice kind="empty" title="Not found" detail="The metadata detail response did not contain this instance." />
            )}
          </Drawer>
        )
      ) : null}

      <CreateInstance
        open={createOpen}
        pending={create.isPending}
        error={create.error}
        created={create.data ? { instanceId: create.data.instanceId, token: create.data.token } : undefined}
        onCreate={(name) => create.mutate({ name })}
        onClose={closeCreate}
      />
    </>
  );
}
