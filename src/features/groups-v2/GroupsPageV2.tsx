import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { ApiFailure, type ProjectionMeta } from '@/api/envelopes';
import { omitSearchParams, updateSearchParams, withSearchParams } from '@/lib/url-search-state';
import { useInvalidCursorReset } from '@/lib/useInvalidCursorReset';
import { Button, PageHeader, StateNotice, Status, type Tone } from '@/ui';
import { CreateGroupV2 } from './CreateGroupV2';
import { GroupsView } from './GroupsView';
import { GroupWorkspaceV2 } from './GroupWorkspaceV2';
import { useCreateGroupV2, useGroupsV2 } from './hooks';
import { groupRouteState } from './route-state';

function Blocked({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader eyebrow="Messaging" title="Groups" description="Projection-backed group directory and explicit provider commands." />
      <StateNotice kind="empty" title={title} detail={detail} />
    </div>
  );
}

function ProjectionStatus({ meta }: { meta?: ProjectionMeta }) {
  if (!meta?.syncStatus) return null;
  const tone: Tone = meta.syncStatus === 'ready' ? 'ok' : meta.syncStatus === 'failed' ? 'failed' : meta.syncStatus === 'stale' ? 'degraded' : 'pending';
  return <div className="py-2"><Status tone={tone}>Projection {meta.syncStatus.replace('_', ' ')}</Status></div>;
}

function Fail({ error, stale, onRetry }: { error: unknown; stale?: boolean; onRetry: () => void }) {
  const f = error instanceof ApiFailure ? error : undefined;
  const notReady = f?.code === 'projection_not_ready';
  return <StateNotice kind={notReady ? 'empty' : 'error'} title={notReady ? 'Projection not ready' : stale ? 'Showing last known data' : 'Read failed'} detail={f?.message ?? 'An unexpected error occurred.'} requestId={f?.requestId} action={notReady ? undefined : <Button onClick={onRetry}>Retry</Button>} />;
}

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
  useInvalidCursorReset(list.error, route.cursor, () => setParam('cursor'));

  if (!instanceScope) return <Blocked title="Instance credential required" detail="Groups requires an instance credential. Admin scope cannot read token-scoped group projections, and no request was sent." />;
  if (capabilities.isPending) return <Blocked title="Discovering capabilities" detail="Discovering instance capabilities before enabling group projection reads." />;
  if (capabilities.isError && !list.data) return <Blocked title="Unsupported" detail="Capability discovery failed. Groups remains disabled and no live fallback was sent." />;
  if (!groupsReady && !list.data) return <Blocked title="Projection unavailable" detail="The backend does not currently advertise groups_projection, which may be unsupported or waiting for readiness. Capability polling continues; no live WhatsApp lookup is used." />;

  return (
    <>
      <GroupsView
        refreshing={list.isFetching}
        onRefresh={() => list.refetch()}
        onNew={() => { create.reset(); setParam('create', '1'); }}
        commandsEnabled={groupsReady}
        ack={ack ? <StateNotice kind="info" title={`${ack} accepted`} detail="The refreshed group projection remains authoritative." /> : undefined}
        metrics={list.data && groups.length > 0 ? {
          loaded: groups.length,
          members: groups.reduce((s, g) => s + (g.memberCount ?? 0), 0),
          admins: groups.reduce((s, g) => s + (g.adminCount ?? 0), 0),
          announce: groups.filter((g) => g.announce).length,
        } : undefined}
        searchDraft={searchDraft}
        onSearchDraft={setSearchDraft}
        onApply={(e) => { e.preventDefault(); applySearch(); }}
        applyDisabled={searchDraft.trim() === route.search || list.isFetching}
        projectionStatus={list.data ? <><ProjectionStatus meta={list.data.meta} />{!groupsReady ? <StateNotice kind="empty" title="Capability changed" detail="Keeping the last usable group projection visible while capability discovery no longer advertises groups_projection." /> : null}</> : undefined}
        notices={list.error && !list.data ? <Fail error={list.error} onRetry={() => list.refetch()} /> : list.error ? <Fail error={list.error} stale onRetry={() => list.refetch()} /> : undefined}
        initialLoading={list.isPending}
        empty={Boolean(list.data) && groups.length === 0 && authoritative}
        emptyDetail={route.search ? 'No projected group matches this prefix.' : 'The ready group projection contains no groups.'}
        groups={groups}
        selectedId={groupId}
        onOpen={openGroup}
        cursor={route.cursor}
        nextCursor={list.data?.resource?.pagination.nextCursor ?? undefined}
        onCursor={(v) => setParam('cursor', v)}
      />

      {groupId && groupsReady ? <GroupWorkspaceV2 groupId={groupId} enabled outboundEnabled={outboundReady} onClose={() => navigate(listUrl)} onLeft={() => { setAck('Leave group'); navigate(listUrl); }} /> : null}
      <CreateGroupV2 open={route.create && groupsReady} pending={create.isPending} error={create.error} onClose={closeCreate} onCreate={(body) => create.mutate(body, { onSuccess: () => { setAck('Create group'); closeCreate(); } })} />
    </>
  );
}
