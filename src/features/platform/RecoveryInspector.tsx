import type { ProjectionFailure } from '@/api/recovery';
import { ApiFailureNotice } from '@/components/ApiFailureNotice';
import { humanizeToken, relativeTime } from '@/lib/format';
import { Button, DescriptionItem, DescriptionList, Dialog, Drawer, Field, Input, Panel, Status } from '@/ui';

export type RecoveryAction = 'replay' | 'discard';

export function RecoveryInspector({
  failure,
  commandsEnabled,
  onClose,
  onAction,
}: {
  failure?: ProjectionFailure;
  commandsEnabled: boolean;
  onClose: () => void;
  onAction: (action: RecoveryAction) => void;
}) {
  return (
    <Drawer open={Boolean(failure)} onClose={onClose} title={humanizeToken(failure?.resource, 'Projection failure')} subtitle={failure?.eventKey}>
      {failure ? (
        <div className="grid gap-4">
          <Panel
            title="Failure facts"
            description="Persisted terminal projection record."
            actions={<Status tone="failed">{humanizeToken(failure.failureClass, 'Failed')}</Status>}
            bodyPadding="compact-top"
          >
            <DescriptionList>
              <DescriptionItem label="Event key" mono>{failure.eventKey}</DescriptionItem>
              <DescriptionItem label="Instance" mono>{failure.instanceId}</DescriptionItem>
              <DescriptionItem label="Resource">{humanizeToken(failure.resource)}</DescriptionItem>
              <DescriptionItem label="Event type">{humanizeToken(failure.eventType)}</DescriptionItem>
              <DescriptionItem label="Error code" mono>{failure.lastErrorCode ?? 'Not reported'}</DescriptionItem>
              <DescriptionItem label="Attempts">{`${failure.retryCount ?? '—'} of ${failure.maxAttempts ?? '—'}`}</DescriptionItem>
              <DescriptionItem label="Occurred">{relativeTime(failure.occurredAt) || 'Not reported'}</DescriptionItem>
              <DescriptionItem label="Last attempt">{relativeTime(failure.lastAttemptAt) || 'Not reported'}</DescriptionItem>
              <DescriptionItem label="Dead-lettered">{relativeTime(failure.deadLetteredAt) || 'Not reported'}</DescriptionItem>
            </DescriptionList>
          </Panel>
          <Panel title="Recovery actions" description="Commands are audited and revalidated by the backend. Acknowledgement is not recovered state.">
            <div className="flex flex-wrap gap-2 max-sm:[&>*]:flex-1">
              <Button variant="primary" disabled={!commandsEnabled} onClick={() => onAction('replay')}>Replay…</Button>
              <Button variant="danger" disabled={!commandsEnabled} onClick={() => onAction('discard')}>Discard…</Button>
            </div>
          </Panel>
        </div>
      ) : null}
    </Drawer>
  );
}

export function RecoveryCommandDialog({
  failure,
  action,
  reason,
  pending,
  error,
  onReason,
  onClose,
  onSubmit,
}: {
  failure?: ProjectionFailure;
  action?: RecoveryAction;
  reason: string;
  pending: boolean;
  error?: unknown;
  onReason: (reason: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog
      open={Boolean(failure && action)}
      onClose={onClose}
      closeDisabled={pending}
      title={action === 'replay' ? 'Replay this failure?' : 'Discard this failure?'}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>Cancel</Button>
          <Button variant={action === 'discard' ? 'danger' : 'primary'} onClick={onSubmit} disabled={reason.trim().length < 8 || pending}>{pending ? 'Submitting…' : action === 'replay' ? 'Submit replay' : 'Confirm discard'}</Button>
        </>
      }
    >
      {failure ? (
        <div className="grid gap-3">
          <p className="text-sm text-fg-2">{action === 'replay' ? 'The server will acknowledge the replay request. Recovery remains authoritative only after a refreshed projection and failure list.' : 'Discard is irreversible for this dead letter. It does not repair or replay the underlying projection event.'}</p>
          <Field label="Operator reason">
            {(id) => <Input id={id} value={reason} minLength={8} required autoFocus disabled={pending} placeholder="Minimum 8 characters for the audit record" onChange={(event) => onReason(event.target.value)} />}
          </Field>
          <div className="grid gap-1 font-mono text-xs text-fg-3">
            <span>instance: {failure.instanceId}</span>
            <span>resource: {failure.resource}</span>
            <span>event: {failure.eventKey}</span>
          </div>
          {error ? <ApiFailureNotice error={error} title="Command failed" /> : null}
        </div>
      ) : null}
    </Dialog>
  );
}
