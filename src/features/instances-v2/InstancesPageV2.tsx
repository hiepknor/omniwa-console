import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { useResilientReadState } from '@/lib/query-state';
import { omitSearchParams, updateSearchParams, withSearchParams } from '@/lib/url-search-state';
import { Drawer, PageHeader, StateNotice } from '@/ui';
import { CreateInstanceV2 } from './CreateInstanceV2';
import { CredentialHealthV2 } from './CredentialHealthV2';
import { useCreateInstanceV2, useInstanceV2, useInstancesV2 } from './hooks';
import { InstancesView } from './InstancesView';
import { InstanceWorkspaceV2 } from './InstanceWorkspaceV2';
import { filterInstancesV2, instanceFiltersFromSearch } from './route-state';
import { FailureNotice } from './ui';

function Blocked({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader eyebrow="Platform" title="Instances" description="Fleet metadata, pairing, lifecycle, settings, and credential posture." />
      <StateNotice kind="empty" title={title} detail={detail} />
    </div>
  );
}

export function InstancesPageV2() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const metadataAvailable = capabilities.data?.capabilities.includes('instance_metadata_views') ?? false;
  const enabled = session.keyKind === 'admin' && metadataAvailable;
  const { instanceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const list = useInstancesV2(enabled);
  const detail = useInstanceV2(instanceId, enabled);
  const create = useCreateInstanceV2();
  const state = useResilientReadState(list, list.data?.resource !== undefined);
  const [destroyAck, setDestroyAck] = useState(false);
  const filters = instanceFiltersFromSearch(searchParams);
  const search = filters.search;
  const status = filters.status ?? '';
  const createOpen = searchParams.get('create') === '1';
  const instances = useMemo(() => list.data?.resource?.items ?? [], [list.data]);
  const filtered = useMemo(() => filterInstancesV2(instances, filters), [instances, filters]);

  const setParam = (key: string, value?: string) => {
    setSearchParams(updateSearchParams(searchParams, { [key]: value }), { replace: true });
  };
  const routeParams = omitSearchParams(searchParams, ['create']);
  const listUrl = withSearchParams('/instances', routeParams);
  const openInstance = (id: string) => navigate(withSearchParams(`/instances/${encodeURIComponent(id)}`, routeParams));
  const closeCreate = () => { create.reset(); setParam('create'); };

  if (session.keyKind !== 'admin') return <Blocked title="Admin credential required" detail="Instance fleet management requires an admin credential. No fleet request was sent." />;
  if (capabilities.isPending) return <Blocked title="Discovering capabilities" detail="Waiting for capability discovery." />;
  if (!metadataAvailable) return <Blocked title="Unsupported" detail={capabilities.isError ? 'Capability discovery failed; fleet metadata remains disabled.' : 'The backend does not advertise instance_metadata_views.'} />;

  return (
    <>
      {destroyAck ? (
        <div className="px-6 pt-6 max-sm:px-4">
          <StateNotice kind="info" title="Destroy accepted" detail="The refreshed metadata list remains authoritative." />
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
        credentialHealth={<CredentialHealthV2 />}
      />

      {instanceId ? (
        detail.data?.resource ? (
          <InstanceWorkspaceV2
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

      <CreateInstanceV2
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
