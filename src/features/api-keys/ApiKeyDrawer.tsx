import { useId, useState } from 'react';
import type { ApiKeyCommandResult, ApiKeyResource } from '@/api/api-keys';
import { CategoryPill, StatusIndicator } from '@/components/badges';
import { DetailDrawer, DetailDrawerState, DrawerIdentifier, DrawerTechnicalValue } from '@/components/drawer/DetailDrawer';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { TypedConfirmationDialog } from '@/components/TypedConfirmationDialog';
import { relativeTime } from '@/lib/format';
import { RotateKeyDialog } from './RotateKeyDialog';
import { useRevokeApiKey } from './hooks';
import { keyKindLabel } from './presentation';

function RevokeKeyDialog({ apiKey, onClose, onRevoked }: {
  apiKey: ApiKeyResource;
  onClose: () => void;
  onRevoked: (result: ApiKeyCommandResult) => void;
}) {
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
        { onSuccess: onRevoked },
      )}
      description={<p>Revocation is permanent. This key will stop authenticating immediately.</p>}
    >
      <div className="field settings-revoke-reason">
        <label htmlFor="api-key-revocation-reason">Reason code <span className="help">optional</span></label>
        <input className="input" id="api-key-revocation-reason" value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} disabled={revoke.isPending} autoComplete="off" />
      </div>
    </TypedConfirmationDialog>
  );
}

export function ApiKeyDrawer({
  apiKey,
  onClose,
  onSecret,
}: {
  apiKey: ApiKeyResource;
  onClose: () => void;
  onSecret: (keyId: string, secret: string) => void;
}) {
  const titleId = useId();
  const [rotateOpen, setRotateOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const feedback = useFeedback();
  const active = apiKey.status === 'active';
  const complete = (result: ApiKeyCommandResult, action: string, detail: string) => feedback.command(result.disposition, {
    action,
    acceptedDetail: `${action} was accepted. API key inventory refreshes automatically.`,
    completedDetail: detail,
    requestId: result.requestId,
    dedupeKey: `api-key:${apiKey.id}:${action.toLowerCase()}`,
  });

  return (
    <>
      <DetailDrawer
        titleId={titleId}
        eyebrow="API key management"
        title={keyKindLabel(apiKey.kind)}
        status={<StatusIndicator dotClass={active ? 'dot-ok' : 'dot-muted'}>{apiKey.status}</StatusIndicator>}
        subtitle={<DrawerIdentifier value={apiKey.id} label="Copy API key identifier" />}
        closeLabel="Close API key details"
        suppressEscape={rotateOpen || revokeOpen}
        onClose={onClose}
      >
        <section aria-labelledby={`${titleId}-facts`}>
          <span className="eyebrow">Credential facts</span>
          <h3 id={`${titleId}-facts`}>Inventory record</h3>
          <dl className="kv">
            <dt>Kind</dt><dd>{keyKindLabel(apiKey.kind)}</dd>
            <dt>Created</dt><dd className="ts" title={apiKey.createdAt}>{relativeTime(apiKey.createdAt) || '—'}</dd>
            <dt>Updated</dt><dd className="ts" title={apiKey.updatedAt}>{relativeTime(apiKey.updatedAt) || '—'}</dd>
          </dl>
        </section>

        <section aria-labelledby={`${titleId}-access`}>
          <span className="eyebrow">Access policy</span>
          <h3 id={`${titleId}-access`}>Granted boundaries</h3>
          <div className="mt-4">
            <span className="label">Scopes</span>
            <div className="capchips mt-2">{apiKey.scopes.map((scope) => <CategoryPill title={scope} key={scope}>{scope}</CategoryPill>)}</div>
          </div>
          <div className="mt-5">
            <span className="label">Allowed instance refs</span>
            {(apiKey.allowedInstanceRefs ?? []).length > 0
              ? <div className="capchips mt-2">{apiKey.allowedInstanceRefs?.map((ref) => <CategoryPill title={ref} key={ref}>{ref}</CategoryPill>)}</div>
              : <p className="help mt-2">No instance restriction was submitted. The platform determines the resulting access semantics.</p>}
          </div>
        </section>

        <section aria-labelledby={`${titleId}-lifecycle`}>
          <span className="eyebrow">Lifecycle record</span>
          <h3 id={`${titleId}-lifecycle`}>Credential history</h3>
          <dl className="kv">
            <dt>Rotated from</dt><dd><DrawerTechnicalValue value={apiKey.rotatedFromKeyId} /></dd>
            <dt>Revoked</dt><dd className="ts" title={apiKey.revokedAt}>{relativeTime(apiKey.revokedAt) || '—'}</dd>
            <dt>Reason</dt><dd><DrawerTechnicalValue value={apiKey.revocationReasonCode} /></dd>
          </dl>
        </section>

        <section aria-labelledby={`${titleId}-actions`}>
          <span className="eyebrow">Credential controls</span>
          <h3 id={`${titleId}-actions`}>Lifecycle</h3>
          {active ? (
            <div className="action-group">
              <span>Rotation replaces the plaintext credential. Revocation permanently disables this key.</span>
              <div className="actions">
                <button className="btn" type="button" onClick={() => setRotateOpen(true)}>Rotate…</button>
                <button className="btn danger" type="button" onClick={() => setRevokeOpen(true)}>Revoke…</button>
              </div>
            </div>
          ) : <div className="empty !min-h-24">This key is revoked. No lifecycle commands are available.</div>}
        </section>
      </DetailDrawer>

      {rotateOpen && <RotateKeyDialog apiKey={apiKey} onCancel={() => setRotateOpen(false)} onRotated={(keyId, secret, result) => {
        complete(result, 'Rotate API key', 'The platform rotated the API key. Store the replacement secret now.');
        setRotateOpen(false);
        onSecret(keyId, secret);
      }} />}
      {revokeOpen && <RevokeKeyDialog apiKey={apiKey} onClose={() => setRevokeOpen(false)} onRevoked={(result) => {
        complete(result, 'Revoke API key', 'The platform revoked the API key. Inventory refreshes automatically.');
        setRevokeOpen(false);
      }} />}
    </>
  );
}

export function ApiKeyDrawerState({ keyId, onClose, children, announce = false }: {
  keyId: string;
  onClose: () => void;
  children: React.ReactNode;
  announce?: boolean;
}) {
  return <DetailDrawer titleId="api-key-detail-title" eyebrow="API key management" title="API key details" subtitle={<DrawerIdentifier value={keyId} label="Copy API key identifier" />} closeLabel="Close API key details" onClose={onClose}><DetailDrawerState announce={announce}>{children}</DetailDrawerState></DetailDrawer>;
}
