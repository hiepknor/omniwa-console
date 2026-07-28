import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { ApiFailure, type ProjectionMeta } from '@/api/envelopes';
import { ApiFailureNotice } from '@/components/ApiFailureNotice';
import { omitSearchParams, updateSearchParams, withSearchParams } from '@/lib/url-search-state';
import { useInvalidCursorReset } from '@/lib/useInvalidCursorReset';
import { PageHeader, StateNotice, Status, type Tone } from '@/ui';
import { CreateGroup } from './CreateGroup';
import { JoinGroup } from './JoinGroup';
import { GroupsView } from './GroupsView';
import { GroupWorkspace } from './GroupWorkspace';
import { useCreateGroup, useGroupSummary, useGroups, useJoinGroup } from './hooks';
import { groupRouteState } from './route-state';
import { GroupSectionTabs } from './GroupSectionTabs';

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

export function getEmptyGroupProjectionState(meta: ProjectionMeta | undefined, search: string): { kind: 'empty' | 'loading' | 'error'; title: string; detail: string } {
  const state = meta?.syncStatus;
  if (!state || state === 'ready') {
    return { kind: 'empty', title: 'No groups', detail: search ? 'No projected group matches this prefix.' : 'The ready group projection contains no groups.' };
  }
  if (state === 'syncing') {
    return { kind: 'loading', title: 'Group projection syncing', detail: 'No usable group snapshot has been returned yet. Synchronization continues without a live WhatsApp fallback.' };
  }
  if (state === 'stale') {
    return { kind: 'empty', title: 'Stale projection has no groups', detail: 'This empty snapshot is not authoritative. Refresh after projection recovery before concluding that the instance has no groups.' };
  }
  if (state === 'failed') {
    return { kind: 'error', title: 'Group projection failed', detail: 'No usable group snapshot is available. The Console did not fall back to a live WhatsApp lookup.' };
  }
  return { kind: 'empty', title: 'Group projection not ready', detail: 'The projection has not produced an authoritative snapshot. An empty result is not being presented as an empty directory.' };
}

function Fail({ error, stale, onRetry }: { error: unknown; stale?: boolean; onRetry: () => void }) {
  const f = error instanceof ApiFailure ? error : undefined;
  const notReady = f?.code === 'projection_not_ready';
  return <ApiFailureNotice error={error} kind={notReady ? 'empty' : 'error'} title={notReady ? 'Projection not ready' : stale ? 'Showing last known data' : 'Read failed'} onRetry={notReady ? undefined : onRetry} />;
}

export function GroupsPage() {
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
  const normalized = capabilities.data?.capabilities.includes('group_management_permissions') ?? false;
  const membersEnabled = normalized && (capabilities.data?.capabilities.includes('group_members_projection') ?? false);
  const normalizedCommands = normalized && (capabilities.data?.capabilities.includes('group_management_commands') ?? false);
  const commandsEnabled = normalizedCommands;
  const auditEnabled = normalized && (capabilities.data?.capabilities.includes('group_management_audit') ?? false);
  const photoEnabled = normalizedCommands && (capabilities.data?.capabilities.includes('group_photo_assets') ?? false);
  const summaryEnabled = normalized && (capabilities.data?.capabilities.includes('group_summary') ?? false);
  const filters = { search: route.search, type: route.type, myRole: route.myRole, sendMode: route.sendMode, state: route.state, membershipState: route.membershipState, cursor: route.cursor };
  const list = useGroups(filters, groupsReady, normalized);
  const summary = useGroupSummary(summaryEnabled);
  const create = useCreateGroup(normalizedCommands);
  const join = useJoinGroup();
  const groups = useMemo(() => list.data?.resource?.items ?? [], [list.data]);
  const summaryNotReady = summary.error instanceof ApiFailure && summary.error.code === 'projection_not_ready';
  const listParams = omitSearchParams(searchParams, ['create', 'join', 'tab', 'memberSearch', 'memberRole', 'memberCursor', 'auditCursor']);
  const listUrl = withSearchParams('/groups', listParams);
  const setParam = (key: string, value?: string, resetKeys: readonly string[] = []) => setSearchParams(updateSearchParams(searchParams, { [key]: value }, resetKeys), { replace: true });
  const setDirectoryParam = (key: string, value?: string) => setParam(key, value, ['cursor']);
  const applySearch = () => setDirectoryParam('search', searchDraft.trim());
  const openGroup = (id: string) => navigate(withSearchParams(`/groups/${encodeURIComponent(id)}`, listParams));
  const closeCreate = () => { create.reset(); setParam('create'); };
  const closeJoin = () => { join.reset(); setParam('join'); };
  useInvalidCursorReset(list.error, route.cursor, () => setParam('cursor'));

  if (!instanceScope) return <Blocked title="Instance credential required" detail="Groups requires an instance credential. Admin scope cannot read token-scoped group projections, and no request was sent." />;
  if (capabilities.isPending) return <Blocked title="Discovering capabilities" detail="Discovering instance capabilities before enabling group projection reads." />;
  if (capabilities.isError && !list.data) return <Blocked title="Unsupported" detail="Capability discovery failed. Groups remains disabled and no live fallback was sent." />;
  if (!groupsReady && !list.data) return <Blocked title="Projection unavailable" detail="The backend does not currently advertise groups_projection, which may be unsupported or waiting for readiness. Capability polling continues; no live WhatsApp lookup is used." />;

  return (
    <>
      <GroupsView
        refreshing={list.isFetching}
        sectionNav={<GroupSectionTabs />}
        onRefresh={() => { void list.refetch(); if (summaryEnabled) void summary.refetch(); }}
        onNew={() => { create.reset(); setParam('create', '1'); }}
        onJoin={() => { join.reset(); setParam('join', '1'); }}
        joinEnabled={normalizedCommands}
        commandsEnabled={commandsEnabled}
        normalized={normalized}
        summary={summary.data?.resource}
        summaryNotice={!summaryEnabled ? undefined : summary.isPending ? <StateNotice kind="loading" title="Loading Group summary" /> : summaryNotReady ? <StateNotice kind="loading" title={summary.data ? 'Showing last known Group summary' : 'Group summary syncing'} detail={summary.data ? 'The latest refresh is not ready. Cached authoritative metrics remain visible and were not recomputed from this page.' : 'The authoritative instance-wide summary is not ready; no metrics were derived from this directory page.'} /> : summary.error ? <ApiFailureNotice error={summary.error} title={summary.data ? 'Showing last known Group summary' : 'Group summary unavailable'} onRetry={() => summary.refetch()} /> : undefined}
        ack={ack ? <StateNotice kind="info" title={`${ack} accepted`} detail="The refreshed group projection remains authoritative." /> : undefined}
        searchDraft={searchDraft}
        onSearchDraft={setSearchDraft}
        onApply={(e) => { e.preventDefault(); applySearch(); }}
        applyDisabled={searchDraft.trim() === route.search || list.isFetching}
        filters={{ type: route.type, myRole: route.myRole, sendMode: route.sendMode, state: route.state, membershipState: route.membershipState }}
        onFilter={setDirectoryParam}
        projectionStatus={list.data ? <><ProjectionStatus meta={list.data.meta} />{!groupsReady ? <StateNotice kind="empty" title="Capability changed" detail="Keeping the last usable group projection visible while capability discovery no longer advertises groups_projection." /> : null}</> : undefined}
        notices={list.error && !list.data ? <Fail error={list.error} onRetry={() => list.refetch()} /> : list.error ? <Fail error={list.error} stale onRetry={() => list.refetch()} /> : undefined}
        initialLoading={list.isPending}
        emptyState={list.data && groups.length === 0 ? getEmptyGroupProjectionState(list.data.meta, route.search) : undefined}
        groups={groups}
        selectedId={groupId}
        onOpen={openGroup}
        cursor={route.cursor}
        nextCursor={list.data?.resource?.pagination.nextCursor ?? undefined}
        onCursor={(v) => setParam('cursor', v)}
      />

      {groupId ? <GroupWorkspace groupId={groupId} readEnabled={groupsReady} normalized={normalized} commandsEnabled={commandsEnabled} membersEnabled={membersEnabled} auditEnabled={auditEnabled} photoEnabled={photoEnabled} activeTab={route.tab} memberSearch={route.memberSearch} memberRole={route.memberRole} memberCursor={route.memberCursor} auditCursor={route.auditCursor} onParam={setParam} onTab={(tab) => setParam('tab', tab === 'overview' ? undefined : tab)} onClose={() => navigate(listUrl)} onLeft={() => { setAck('Leave group'); navigate(listUrl); }} /> : null}
      <CreateGroup open={route.create && commandsEnabled} pending={create.isPending} error={create.error} result={create.data} normalized={normalizedCommands} onClose={closeCreate} onCreate={(body) => create.mutate(body)} />
      <JoinGroup open={route.join && normalizedCommands} pending={join.isPending} error={join.error} result={join.data} onClose={closeJoin} onJoin={(code) => join.mutate(code)} />
    </>
  );
}
