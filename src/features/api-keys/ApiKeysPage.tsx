import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ApiKeyCommandResult, ApiKeyResource } from '@/api/api-keys';
import { CategoryPill, CategorySummary, RowStateBadge, StatusIndicator } from '@/components/badges';
import {
  DataTable,
  DataTableFooter,
  DataTableWorkspace,
  type DataTableColumn,
  type DataTableState,
} from '@/components/data-table';
import { SurfaceNotice } from '@/components/feedback/SurfaceNotice';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { PageHeader } from '@/components/PageHeader';
import { MobileRowSummary } from '@/components/data-table/MobileRowSummary';
import { relativeTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import { useApiSession } from '@/api/ApiProvider';
import { ProvisionKeyDialog } from './ProvisionKeyDialog';
import { SecretDialog } from './SecretDialog';
import { ApiKeyDrawer, ApiKeyDrawerState } from './ApiKeyDrawer';
import { useApiKeys } from './hooks';
import { keyKindLabel } from './presentation';

type SecretState = { keyId: string; secret: string };

function Scopes({ scopes }: { scopes: string[] }) {
  return <CategorySummary values={scopes} label="scopes" itemClassName="max-w-[140px]" className="settings-key-scopes" />;
}

function AdminApiKeysSurface() {
  const [searchParams, setSearchParams] = useSearchParams();
  const list = useApiKeys();
  const feedback = useFeedback();
  const pages = list.data?.pages ?? [];
  const readState = useResilientReadState(list, pages.some((page) => page.resource !== undefined));
  const apiKeys = useMemo(() => pages.flatMap((page) => page.resource?.items ?? []), [pages]);
  const unavailable = pages.some((page) => page.unavailable !== undefined);
  const latestUpdate = apiKeys.map((apiKey) => apiKey.updatedAt).sort().at(-1);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [secret, setSecret] = useState<SecretState>();
  const selectedKeyId = searchParams.get('key') || undefined;
  const selectedKey = apiKeys.find((apiKey) => apiKey.id === selectedKeyId);

  const revealSecret = (keyId: string, value: string, result?: ApiKeyCommandResult) => {
    setProvisionOpen(false);
    if (result) feedback.command(result.disposition, {
      action: 'Provision API key',
      acceptedDetail: 'API key provisioning was accepted. Inventory refreshes automatically.',
      completedDetail: 'The platform provisioned the API key. Store the secret now.',
      requestId: result.requestId,
      dedupeKey: `api-key:${keyId}:provision`,
    });
    setSecret({ keyId, secret: value });
  };
  const selectKey = (keyId: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (keyId) next.set('key', keyId); else next.delete('key');
    setSearchParams(next, { replace: true });
  };

  const columns: DataTableColumn<ApiKeyResource>[] = [
    { id: 'id', header: 'ID', size: 'xl', kind: 'identifier', sticky: 'identity', mobile: 'identity', cell: (apiKey) => <><span className="mono" title={apiKey.id}>{apiKey.id}</span>{apiKey.id === selectedKeyId && <RowStateBadge>Open</RowStateBadge>}</> },
    { id: 'kind', header: 'Kind', size: 'md', mobile: 'secondary', cell: (apiKey) => <CategoryPill>{keyKindLabel(apiKey.kind)}</CategoryPill> },
    { id: 'scopes', header: 'Scopes', size: 'xl', mobile: 'identifier', cell: (apiKey) => <Scopes scopes={apiKey.scopes} /> },
    { id: 'status', header: 'Status', size: 'sm', kind: 'status', mobile: 'secondary', cell: (apiKey) => <StatusIndicator dotClass={apiKey.status === 'active' ? 'dot-ok' : 'dot-muted'}>{apiKey.status}</StatusIndicator> },
    { id: 'updated', header: 'Updated', size: 'md', kind: 'date', mobile: 'meta', cell: (apiKey) => <time className="ts" dateTime={apiKey.updatedAt}>{relativeTime(apiKey.updatedAt) || '—'}</time>, mobileCell: (apiKey) => relativeTime(apiKey.updatedAt) || undefined },
  ];

  const renderMobileKey = (apiKey: ApiKeyResource) => (
    <div>
      <MobileRowSummary
        identity={<span className="mono" title={apiKey.id}>{apiKey.id}</span>}
        identifier={<Scopes scopes={apiKey.scopes} />}
        secondary={<span className="flex items-center justify-end gap-2"><CategoryPill>{keyKindLabel(apiKey.kind)}</CategoryPill><StatusIndicator dotClass={apiKey.status === 'active' ? 'dot-ok' : 'dot-muted'}>{apiKey.status}</StatusIndicator></span>}
        meta={relativeTime(apiKey.updatedAt) || undefined}
        actionLabel={`Open API key ${apiKey.id}`}
      />
    </div>
  );

  const tableState: DataTableState<ApiKeyResource> = readState.isInitialError
    ? { status: 'error', error: readState.error, onRetry: list.refetch }
    : readState.isInitialLoading
      ? { status: 'loading', skeletonRows: 6 }
      : unavailable && apiKeys.length === 0
        ? { status: 'unavailable', message: 'API key management is not available on OmniWA GO.' }
        : apiKeys.length === 0
          ? { status: 'empty', message: 'No API keys are visible to this administrator.' }
          : { status: 'ready', rows: apiKeys };

  return (
    <div className="settings-screen api-keys-screen">
      <PageHeader title="API keys" actions={<button className="btn primary" type="button" onClick={() => setProvisionOpen(true)}>Provision API key</button>} />
      <DataTableWorkspace className="settings-keys" aria-labelledby="api-keys-table-title">
        <div className="settings-section-head"><div><h2>Admin key inventory</h2><p>Secrets are shown once after provision or rotation.</p></div><span className="settings-result-count num">{tableState.status === 'ready' || tableState.status === 'empty' ? `${apiKeys.length} loaded keys` : 'Loaded keys —'}</span></div>
        <DataTable
          caption="API key inventory"
          captionId="api-keys-table-title"
          layout="standard"
          attached
          columns={columns}
          state={tableState}
          renderMobileSummary={renderMobileKey}
          refreshIssue={readState.isStaleError ? { error: readState.error, onRetry: list.refetch } : undefined}
          getRowKey={(apiKey) => apiKey.id}
          getRowState={(apiKey) => ({ active: apiKey.id === selectedKeyId })}
          getRowActionLabel={(apiKey) => `Open API key ${apiKey.id}`}
          getRowProps={(apiKey) => ({ className: 'responsive-table-actionable', tabIndex: 0, onClick: () => selectKey(apiKey.id), onKeyDown: (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectKey(apiKey.id); } } })}
          footer={<DataTableFooter primary={tableState.status === 'ready' || tableState.status === 'empty' ? <><span className="num">{apiKeys.length} loaded keys</span><span className="freshness">Updated {relativeTime(latestUpdate) || '—'}</span></> : <span className="num">Results —</span>} actions={<><button className="btn" type="button" disabled={list.isFetching} onClick={() => void list.refetch()}>{list.isFetching ? 'Refreshing…' : 'Refresh'}</button>{list.hasNextPage && <button className="btn" type="button" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>{list.isFetchingNextPage ? 'Loading…' : 'Load more'}</button>}</>} />}
        />
      </DataTableWorkspace>
      {provisionOpen && <ProvisionKeyDialog onCancel={() => setProvisionOpen(false)} onProvisioned={(keyId, value, result) => revealSecret(keyId, value, result)} />}
      {selectedKeyId && (selectedKey
        ? <ApiKeyDrawer apiKey={selectedKey} onClose={() => selectKey(undefined)} onSecret={(keyId, value) => { selectKey(undefined); revealSecret(keyId, value); }} />
        : list.isLoading
          ? <ApiKeyDrawerState keyId={selectedKeyId} onClose={() => selectKey(undefined)} announce>Loading API key details…</ApiKeyDrawerState>
          : <ApiKeyDrawerState keyId={selectedKeyId} onClose={() => selectKey(undefined)}>This API key is not present in the loaded inventory pages.</ApiKeyDrawerState>)}
      {secret && <SecretDialog keyId={secret.keyId} secret={secret.secret} onClose={() => setSecret(undefined)} />}
    </div>
  );
}

export function ApiKeysPage() {
  const session = useApiSession();
  if (session.keyKind !== 'admin') {
    return (
      <div className="settings-screen api-keys-screen">
        <PageHeader title="API keys" />
        <SurfaceNotice kind="error" label="authorization" title="This inventory requires an admin key." detail="Connect with an admin key to view or manage the API key inventory." />
      </div>
    );
  }
  return <AdminApiKeysSurface />;
}
