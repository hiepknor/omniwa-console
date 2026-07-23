import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { ApiFailureNotice, Button, Field, PageHeader, ProjectionStatus, StateNotice, Status, Surface } from '@/components/v2';
import { humanizeToken, relativeTime } from '@/lib/format';
import { omitSearchParams, updateSearchParams, withSearchParams } from '@/lib/url-search-state';
import { CreateGroupV2 } from './CreateGroupV2';
import { GroupWorkspaceV2 } from './GroupWorkspaceV2';
import { useCreateGroupV2, useGroupsV2 } from './hooks';
import { groupRouteState } from './route-state';

export function GroupsPageV2() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const { groupId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const route = groupRouteState(searchParams);
  const [searchDraft, setSearchDraft] = useState(route.search);
  const [ack, setAck] = useState<string>();
  useEffect(() => setSearchDraft(route.search), [route.search]);
  const instanceScope = session.keyKind === 'api';
  const groupsReady = instanceScope && (capabilities.data?.capabilities.includes('groups_projection') ?? false);
  const outboundReady = capabilities.data?.capabilities.includes('outbound_rate_limit') ?? false;
  const list = useGroupsV2(route.search, route.cursor, groupsReady);
  const create = useCreateGroupV2();
  const groups = useMemo(() => list.data?.resource?.items ?? [], [list.data]);
  const authoritative = list.data?.meta?.syncStatus === undefined || list.data.meta.syncStatus === 'ready';
  const listParams = omitSearchParams(searchParams, ['create']);
  const listUrl = withSearchParams('/groups', listParams);
  const setParam = (key: string, value?: string) => setSearchParams(updateSearchParams(searchParams, { [key]: value }, key === 'search' ? ['cursor'] : []), { replace: true });
  const applySearch = () => setParam('search', searchDraft.trim());
  const openGroup = (id: string) => navigate(withSearchParams(`/groups/${encodeURIComponent(id)}`, listParams));
  const closeCreate = () => { create.reset(); setParam('create'); };

  if (!instanceScope) return <Blocked detail="Groups requires an instance credential. Admin scope cannot read token-scoped group projections, and no request was sent." state="invalid" />;
  if (capabilities.isPending) return <Blocked detail="Discovering instance capabilities before enabling group projection reads." state="discovering" />;
  if (capabilities.isError) return <Blocked detail="Capability discovery failed. Groups remains disabled and no live fallback was sent." state="unsupported" />;
  if (!groupsReady) return <Blocked detail="The backend does not advertise groups_projection. No live WhatsApp group lookup is used as a fallback." state="unsupported" />;

  return <div className="ui-v2-page">
    <PageHeader eyebrow="Messaging" title="Groups" description="Projection-backed group directory and explicit provider commands in the active instance scope." actions={<><Button disabled={list.isFetching} onClick={() => list.refetch()}>{list.isFetching ? 'Refreshing…' : 'Refresh'}</Button><Button variant="primary" onClick={() => { create.reset(); setParam('create', '1'); }}>New group</Button></>} />
    <div className="ui-v2-page__content">
      {ack ? <StateNotice value={{ axis: 'command', state: 'acknowledged' }} detail={`${ack} was acknowledged by the server. The refreshed group projection remains authoritative.`} /> : null}
      {list.data && groups.length > 0 ? <div className="ui-v2-metric-grid ui-v2-groups-metrics"><div><span>Loaded groups</span><strong>{groups.length}</strong></div><div><span>Members</span><strong>{groups.reduce((sum, group) => sum + (group.memberCount ?? 0), 0)}</strong></div><div><span>Known admins</span><strong>{groups.reduce((sum, group) => sum + (group.adminCount ?? 0), 0)}</strong></div><div><span>Announcement only</span><strong>{groups.filter((group) => group.announce).length}</strong></div></div> : null}
      <Surface title="Group directory" description="Applied prefix search, opaque cursor, and selected group remain URL-addressable.">
        <form className="ui-v2-group-filters" onSubmit={(event) => { event.preventDefault(); applySearch(); }}><Field label="Prefix search" type="search" value={searchDraft} placeholder="Group name or JID prefix" onChange={(event) => setSearchDraft(event.target.value)} /><Button type="submit" disabled={searchDraft.trim() === route.search || list.isFetching}>Apply search</Button></form>
        {list.isPending ? <StateNotice value={{ axis: 'resource', state: 'initial-loading' }} /> : list.error && !list.data ? <ApiFailureNotice error={list.error} onRetry={() => list.refetch()} /> : list.data ? <><ProjectionStatus meta={list.data.meta} />{list.error ? <ApiFailureNotice error={list.error} stale onRetry={() => list.refetch()} /> : null}{groups.length ? <div className="ui-v2-table-wrap" tabIndex={0} aria-label="Projected group table"><table className="ui-v2-table ui-v2-groups-table"><caption className="ui-v2-visually-hidden">Projected groups</caption><thead><tr><th>Group</th><th>Status</th><th>Members</th><th>Admins</th><th>Updated</th></tr></thead><tbody>{groups.map((group) => <tr key={group.id} data-selected={group.id === groupId || undefined}><td data-label="Group"><button className="ui-v2-row-link" type="button" onClick={() => openGroup(group.id)}>{group.subject ?? group.id}</button><small className="ui-v2-mono">{group.id}</small></td><td data-label="Status"><Status tone={group.status === 'active' ? 'healthy' : 'degraded'}>{humanizeToken(group.status ?? 'unreported')}</Status></td><td data-label="Members">{group.memberCount ?? 'Not reported'}</td><td data-label="Admins">{group.adminCount ?? 'Not reported'}</td><td data-label="Updated" title={group.updatedAt}>{relativeTime(group.updatedAt) || 'Not reported'}</td></tr>)}</tbody></table></div> : authoritative ? <StateNotice value={{ axis: 'resource', state: 'empty' }} detail={route.search ? 'No projected group matches this prefix.' : 'The ready group projection contains no groups.'} /> : null}<div className="ui-v2-pagination"><span>{route.cursor ? 'Opaque cursor page' : `${groups.length} groups on first page`}</span><div>{route.cursor ? <Button onClick={() => setParam('cursor')}>Start over</Button> : null}<Button disabled={!list.data.resource?.pagination.nextCursor} onClick={() => setParam('cursor', list.data?.resource?.pagination.nextCursor ?? undefined)}>Next page</Button></div></div></> : null}
      </Surface>
    </div>
    {groupId ? <GroupWorkspaceV2 groupId={groupId} enabled={groupsReady} outboundEnabled={outboundReady} onClose={() => navigate(listUrl)} onLeft={() => { setAck('Leave group'); navigate(listUrl); }} /> : null}
    <CreateGroupV2 open={route.create} pending={create.isPending} error={create.error} onClose={closeCreate} onCreate={(body) => create.mutate(body, { onSuccess: () => { setAck('Create group'); closeCreate(); } })} />
  </div>;
}

function Blocked({ detail, state }: { detail: string; state: 'invalid' | 'discovering' | 'unsupported' }) { return <div className="ui-v2-page"><PageHeader eyebrow="Messaging" title="Groups" description="Projection-backed group directory and explicit provider commands." /><div className="ui-v2-page__content"><StateNotice value={state === 'invalid' ? { axis: 'session', state } : { axis: 'capability', state }} detail={detail} /></div></div>; }
