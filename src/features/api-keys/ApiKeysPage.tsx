import { useMemo, useState } from 'react';
import type { ApiKeyResource } from '@/api/api-keys';
import { TypedConfirmationDialog } from '@/components/TypedConfirmationDialog';
import {
  DataTable,
  DataTableFooter,
  DataTableWorkspace,
  type DataTableColumn,
  type DataTableState,
} from '@/components/data-table';
import { SurfaceNotice } from '@/components/feedback/SurfaceNotice';
import { PageHeader } from '@/components/PageHeader';
import { MobileRowSummary } from '@/components/data-table/MobileRowSummary';
import { relativeTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import { loadSession } from '@/lib/session';
import { ProvisionKeyDialog } from './ProvisionKeyDialog';
import { RotateKeyDialog } from './RotateKeyDialog';
import { SecretDialog } from './SecretDialog';
import { useApiKeys, useRevokeApiKey } from './hooks';

type SecretState = { keyId: string; secret: string };

function Scopes({ scopes }: { scopes: string[] }) {
  const visible = scopes.slice(0, 2);
  const remaining = scopes.length - visible.length;
  return (
    <span className="settings-key-scopes" title={scopes.join(', ')}>
      {visible.map((scope) => <span className="chip" key={scope}>{scope}</span>)}
      {remaining > 0 && <span className="chip num">+{remaining}</span>}
    </span>
  );
}

function RevokeKeyDialog({ apiKey, onClose }: { apiKey: ApiKeyResource; onClose: () => void }) {
  const [reasonCode, setReasonCode] = useState('');
  const revoke = useRevokeApiKey(apiKey.id);
  return (
    <TypedConfirmationDialog
      title="Revoke API key"
      resourceId={apiKey.id}
      confirmValue={apiKey.id}
      confirmLabel="Revoke key"
      pendingLabel="Revoking…"
      error={revoke.error}
      isPending={revoke.isPending}
      onCancel={onClose}
      onConfirm={() => revoke.mutate(
        reasonCode.trim() ? { reasonCode: reasonCode.trim() } : {},
        { onSuccess: onClose },
      )}
      description={(
        <>
          <p>Revocation is permanent. This key will stop authenticating immediately.</p>
          <div className="field settings-revoke-reason">
            <label htmlFor="api-key-revocation-reason">Reason code <span className="help">optional</span></label>
            <input
              className="input mono"
              id="api-key-revocation-reason"
              value={reasonCode}
              onChange={(event) => setReasonCode(event.target.value)}
              disabled={revoke.isPending}
              autoComplete="off"
            />
          </div>
        </>
      )}
    />
  );
}

function AdminApiKeysSurface() {
  const list = useApiKeys();
  const pages = list.data?.pages ?? [];
  const readState = useResilientReadState(list, pages.some((page) => page.resource !== undefined));
  const apiKeys = useMemo(() => pages.flatMap((page) => page.resource?.items ?? []), [pages]);
  const unavailable = pages.some((page) => page.unavailable !== undefined);
  const latestUpdate = apiKeys.map((apiKey) => apiKey.updatedAt).sort().at(-1);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [rotating, setRotating] = useState<ApiKeyResource>();
  const [revoking, setRevoking] = useState<ApiKeyResource>();
  const [secret, setSecret] = useState<SecretState>();

  const revealSecret = (keyId: string, value: string) => {
    setProvisionOpen(false);
    setRotating(undefined);
    setSecret({ keyId, secret: value });
  };

  const columns: DataTableColumn<ApiKeyResource>[] = [
    { id: 'id', header: 'ID', size: 'xl', kind: 'identifier', sticky: 'identity', mobile: 'identity', cell: (apiKey) => <span className="mono" title={apiKey.id}>{apiKey.id}</span> },
    { id: 'kind', header: 'Kind', size: 'md', mobile: 'secondary', cell: (apiKey) => <span className="pill">{apiKey.kind}</span> },
    { id: 'scopes', header: 'Scopes', size: 'xl', mobile: 'identifier', cell: (apiKey) => <Scopes scopes={apiKey.scopes} /> },
    { id: 'status', header: 'Status', size: 'sm', kind: 'status', mobile: 'meta', cell: (apiKey) => <span className="status"><span className={`dot ${apiKey.status === 'active' ? 'dot-ok' : 'dot-muted'}`} />{apiKey.status}</span> },
    { id: 'created', header: 'Created', size: 'md', kind: 'date', mobile: 'hidden', cell: (apiKey) => <time className="ts" dateTime={apiKey.createdAt} title={apiKey.createdAt}>{relativeTime(apiKey.createdAt) || '—'}</time> },
    { id: 'updated', header: 'Updated', size: 'md', kind: 'date', mobile: 'hidden', cell: (apiKey) => <time className="ts" dateTime={apiKey.updatedAt}>{relativeTime(apiKey.updatedAt) || '—'}</time> },
    { id: 'actions', header: <span className="visually-hidden">Actions</span>, size: 'xl', kind: 'action', align: 'end', mobile: 'hidden', cell: (apiKey) => <span className="settings-key-actions"><button className="btn sm" type="button" disabled={apiKey.status === 'revoked'} onClick={() => setRotating(apiKey)}>Rotate…</button><button className="btn sm danger" type="button" disabled={apiKey.status === 'revoked'} onClick={() => setRevoking(apiKey)}>Revoke…</button></span> },
  ];

  const renderMobileKey = (apiKey: ApiKeyResource) => (
    <div>
      <MobileRowSummary
        identity={<span className="mono" title={apiKey.id}>{apiKey.id}</span>}
        identifier={<Scopes scopes={apiKey.scopes} />}
        secondary={<span className="pill">{apiKey.kind}</span>}
        meta={<span className="status"><span className={`dot ${apiKey.status === 'active' ? 'dot-ok' : 'dot-muted'}`} />{apiKey.status}</span>}
      />
      <div className="settings-key-actions border-t border-[var(--border-subtle)] px-3 py-2">
        <button className="btn sm" type="button" disabled={apiKey.status === 'revoked'} onClick={() => setRotating(apiKey)}>Rotate…</button>
        <button className="btn sm danger" type="button" disabled={apiKey.status === 'revoked'} onClick={() => setRevoking(apiKey)}>Revoke…</button>
      </div>
    </div>
  );

  const tableState: DataTableState<ApiKeyResource> = readState.isInitialError
    ? { status: 'error', error: readState.error, onRetry: list.refetch }
    : readState.isInitialLoading
      ? { status: 'loading', skeletonRows: 6 }
      : unavailable && apiKeys.length === 0
        ? { status: 'unavailable', message: 'API key inventory is not available from this platform.' }
        : apiKeys.length === 0
          ? { status: 'empty', message: 'No API keys are visible to this administrator.' }
          : { status: 'ready', rows: apiKeys };

  return (
    <div className="settings-screen api-keys-screen">
      <PageHeader title="API keys" actions={<button className="btn primary" type="button" onClick={() => setProvisionOpen(true)}>Provision key…</button>} />
      <DataTableWorkspace className="settings-keys" aria-labelledby="api-keys-table-title">
        <div className="settings-section-head"><div><h2>Admin key inventory</h2><p>Secrets are shown once after provision or rotation.</p></div><span className="settings-result-count num">{tableState.status === 'ready' || tableState.status === 'empty' ? `${apiKeys.length} loaded keys` : 'Loaded keys —'}</span></div>
        <DataTable
          caption="API key inventory"
          captionId="api-keys-table-title"
          layout="wide"
          attached
          columns={columns}
          state={tableState}
          renderMobileSummary={renderMobileKey}
          refreshIssue={readState.isStaleError ? { error: readState.error, onRetry: list.refetch } : undefined}
          getRowKey={(apiKey) => apiKey.id}
          footer={<DataTableFooter primary={tableState.status === 'ready' || tableState.status === 'empty' ? <><span className="num">{apiKeys.length} loaded keys</span><span className="freshness">Updated {relativeTime(latestUpdate) || '—'}</span></> : <span className="num">Results —</span>} actions={<><button className="btn" type="button" disabled={list.isFetching} onClick={() => void list.refetch()}>{list.isFetching ? 'Refreshing…' : 'Refresh'}</button>{list.hasNextPage && <button className="btn" type="button" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>{list.isFetchingNextPage ? 'Loading…' : 'Load more'}</button>}</>} />}
        />
      </DataTableWorkspace>
      {provisionOpen && <ProvisionKeyDialog onCancel={() => setProvisionOpen(false)} onProvisioned={revealSecret} />}
      {rotating && <RotateKeyDialog apiKey={rotating} onCancel={() => setRotating(undefined)} onRotated={revealSecret} />}
      {revoking && <RevokeKeyDialog apiKey={revoking} onClose={() => setRevoking(undefined)} />}
      {secret && <SecretDialog keyId={secret.keyId} secret={secret.secret} onClose={() => setSecret(undefined)} />}
    </div>
  );
}

export function ApiKeysPage() {
  if (loadSession()?.keyKind !== 'admin') {
    return (
      <div className="settings-screen api-keys-screen">
        <PageHeader title="API keys" />
        <SurfaceNotice kind="error" label="authorization" title="This inventory requires an admin key." detail="Connect with an admin key to view or manage the API key inventory." />
      </div>
    );
  }
  return <AdminApiKeysSurface />;
}
