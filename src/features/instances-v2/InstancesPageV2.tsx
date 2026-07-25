import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { Button, Field, Inspector, PageGuard, PageHeader, StateNotice, Status, Surface } from '@/components/v2';
import { humanizeToken, relativeTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import { omitSearchParams, updateSearchParams, withSearchParams } from '@/lib/url-search-state';
import { CreateInstanceV2 } from './CreateInstanceV2';
import { CredentialHealthV2 } from './CredentialHealthV2';
import { useCreateInstanceV2, useInstanceV2, useInstancesV2 } from './hooks';
import { InstanceWorkspaceV2 } from './InstanceWorkspaceV2';
import { filterInstancesV2, instanceFiltersFromSearch } from './route-state';
import { FailureNotice } from './ui';

function Blocked({ detail, state }: { detail?: string; state: 'invalid' | 'discovering' | 'unsupported' }) { return <PageGuard eyebrow="Platform" title="Instances" description="Fleet metadata, pairing, lifecycle, settings, and credential posture." state={state} detail={detail} />; }

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
  const filtered = useMemo(() => {
    return filterInstancesV2(instances, filters);
  }, [instances, filters.search, filters.status]);

  const setParam = (key: string, value?: string) => {
    setSearchParams(updateSearchParams(searchParams, { [key]: value }), { replace: true });
  };
  const routeParams = omitSearchParams(searchParams, ['create']);
  const listUrl = withSearchParams('/instances', routeParams);
  const openInstance = (id: string) => navigate(withSearchParams(`/instances/${encodeURIComponent(id)}`, routeParams));
  const closeCreate = () => { create.reset(); setParam('create'); };

  if (session.keyKind !== 'admin') return <Blocked state="invalid" detail="Instance fleet management requires an admin credential. No fleet request was sent." />;
  if (capabilities.isPending) return <Blocked state="discovering" />;
  if (!metadataAvailable) return <Blocked state="unsupported" detail={capabilities.isError ? 'Capability discovery failed; fleet metadata remains disabled.' : 'The backend does not advertise instance_metadata_views. V2 does not fall back to credential-bearing legacy instance reads.'} />;

  return <div className="ui-v2-page">
    <PageHeader eyebrow="Platform" title="Instances" description="Secret-free fleet metadata with explicit instance-scoped credential attachment." actions={<><Button disabled={list.isFetching} onClick={() => list.refetch()}>{list.isFetching ? 'Refreshing…' : 'Refresh'}</Button><Button variant="primary" onClick={() => { create.reset(); setParam('create', '1'); }}>New instance</Button></>} />
    <div className="ui-v2-page__content">
      {destroyAck ? <StateNotice value={{ axis: 'command', state: 'acknowledged' }} detail="Destroy was acknowledged by the server. The refreshed metadata list remains authoritative." /> : null}
      <CredentialHealthV2 />
      <Surface title="Fleet metadata" description="List and detail use /instance/metadata only; tokens never enter view models or query keys.">
        <div className="ui-v2-instance-filters"><Field label="Search" type="search" value={search} placeholder="Name or instance ID" onChange={(event) => setParam('search', event.target.value)} /><label className="ui-v2-field"><span className="ui-v2-field__label">Status</span><select className="ui-v2-input" value={status} onChange={(event) => setParam('status', event.target.value)}><option value="">All statuses</option><option value="connected">Connected</option><option value="disconnected">Disconnected</option></select></label></div>
        {state.isInitialLoading ? <StateNotice value={{ axis: 'resource', state: 'initial-loading' }} detail="Reading instance metadata." /> : null}
        {state.isError ? <FailureNotice error={state.error} stale={state.isStaleError} onRetry={() => list.refetch()} /> : null}
        {list.data && instances.length === 0 ? <StateNotice value={{ axis: 'resource', state: 'empty' }} detail="The authoritative metadata list contains no instances. This is not a representative credential-health workload." /> : null}
        {instances.length > 0 && filtered.length === 0 ? <StateNotice value={{ axis: 'resource', state: 'empty' }} detail="No loaded instance matches the URL-backed filters." /> : null}
        {filtered.length > 0 ? <div className="ui-v2-table-wrap" tabIndex={0} aria-label="Instance metadata table"><table className="ui-v2-table ui-v2-instances-table"><caption className="ui-v2-visually-hidden">Instance metadata</caption><thead><tr><th>Name</th><th>Instance ID</th><th>Status</th><th>Credential</th><th>Created</th></tr></thead><tbody>{filtered.map((instance) => <tr key={instance.id} data-selected={instance.id === instanceId || undefined}><td data-label="Name"><button className="ui-v2-row-link" type="button" onClick={() => openInstance(instance.id)}>{instance.displayName ?? 'Unnamed instance'}</button></td><td data-label="Instance ID" className="ui-v2-mono">{instance.id}</td><td data-label="Status"><Status tone={instance.connected ? 'healthy' : 'failed'}>{humanizeToken(instance.status)}</Status></td><td data-label="Credential" className="ui-v2-mono">{instance.credentialVersion ? `v${instance.credentialVersion}` : 'Not reported'}</td><td data-label="Created" title={instance.createdAt}>{relativeTime(instance.createdAt) || 'Not reported'}</td></tr>)}</tbody></table></div> : null}
        <p className="ui-v2-generated-note">{filtered.length} of {instances.length} loaded instances. Polling every 15 seconds while this route is open.</p>
      </Surface>
    </div>

    {instanceId ? detail.data?.resource ? <InstanceWorkspaceV2 instance={detail.data.resource} refreshError={detail.error} onRetry={() => detail.refetch()} onClose={() => navigate(listUrl)} onDestroyed={() => { setDestroyAck(true); navigate(listUrl); }} /> : detail.isPending ? <InspectorState instanceId={instanceId} onClose={() => navigate(listUrl)}><StateNotice value={{ axis: 'resource', state: 'initial-loading' }} /></InspectorState> : detail.error ? <InspectorState instanceId={instanceId} onClose={() => navigate(listUrl)}><FailureNotice error={detail.error} onRetry={() => detail.refetch()} /></InspectorState> : <InspectorState instanceId={instanceId} onClose={() => navigate(listUrl)}><StateNotice value={{ axis: 'resource', state: 'empty' }} detail="The metadata detail response did not contain this instance." /></InspectorState> : null}
    <CreateInstanceV2 open={createOpen} pending={create.isPending} error={create.error} created={create.data ? { instanceId: create.data.instanceId, token: create.data.token } : undefined} onCreate={(name) => create.mutate({ name })} onClose={closeCreate} />
  </div>;
}

function InspectorState({ instanceId, onClose, children }: { instanceId: string; onClose: () => void; children: ReactNode }) {
  return <Inspector titleId="instance-v2-state" eyebrow="Instance workspace" title="Instance details" subtitle={<span className="ui-v2-mono">{instanceId}</span>} modal onClose={onClose}>{children}</Inspector>;
}
