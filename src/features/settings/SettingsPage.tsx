import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiFailure } from '@/api/envelopes';
import type { SettingsResource } from '@/api/settings';
import { PageHeader } from '@/components/PageHeader';
import { InlineError } from '@/components/InlineError';
import { TypedConfirmationDialog } from '@/components/TypedConfirmationDialog';
import { SurfaceNotice } from '@/components/feedback/SurfaceNotice';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { relativeTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import { keyFingerprint, loadSession } from '@/lib/session';
import { isTransportError } from '@/components/feedback/feedback-policy';
import { useActivateSettings, useSettings, useValidateSettings } from './hooks';

const INITIAL_DRAFT = '';

function absoluteTime(value: string | undefined): string {
  if (value === undefined) return 'Not reported';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' });
}

function parseDraft(value: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(value);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('The draft must be a JSON object.');
  }
  return parsed as Record<string, unknown>;
}

function FailureNotice({ error, title }: { error: unknown; title?: string }) {
  const failure = error instanceof ApiFailure ? error : undefined;
  return (
    <SurfaceNotice
      kind="error"
      label={failure?.category ?? 'error'}
      title={title ?? (error instanceof Error ? error.message : 'Request failed')}
      detail={title && error instanceof Error ? error.message : undefined}
      requestId={failure?.requestId}
      showMissingRequestId={failure !== undefined}
      announcement="polite"
    />
  );
}

function RuntimeStatus({ settings }: { settings: SettingsResource }) {
  const updated = relativeTime(settings.updatedAt) || 'Not reported';
  return (
    <section className="settings-runtime" aria-labelledby="settings-runtime-heading" data-od-id="settings-runtime-status">
      <div>
        <h2 id="settings-runtime-heading">Runtime configuration</h2>
        <p>The active revision governs platform-side configuration.</p>
      </div>
      <div className="settings-runtime-state">
        <span className={`status${settings.status === 'active' ? ' status-active' : ''}`}>
          <span className="dot" />{settings.status ?? 'unknown'}
        </span>
        <span className="mono">{settings.id ?? 'Revision not reported'}</span>
        <span>profile {settings.profile ?? 'not reported'}</span>
        <span className="ts" title={settings.updatedAt}>{updated} · {absoluteTime(settings.updatedAt)}</span>
      </div>
    </section>
  );
}

function ActiveConfiguration({ settings }: { settings: SettingsResource }) {
  const fields = [
    ['Revision ID', settings.id],
    ['Status', settings.status],
    ['Profile', settings.profile],
    ['Updated', absoluteTime(settings.updatedAt)],
  ] as const;

  return (
    <section className="settings-panel" aria-labelledby="active-configuration-heading" data-od-id="settings-active-configuration">
      <header className="settings-panel-head">
        <div>
          <h2 id="active-configuration-heading">Active configuration</h2>
          <p>Read-only values currently projected by the platform.</p>
        </div>
        <span className="pill">{settings.profile ?? 'profile unavailable'}</span>
      </header>
      <dl className="settings-config-list">
        {fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? 'Not reported'}</dd></div>)}
      </dl>
      <p className="help settings-projection-note">The full configuration payload is not projected through the public read. Drafts must contain the entire intended revision.</p>
    </section>
  );
}

function DraftRevision() {
  const feedback = useFeedback();
  const validate = useValidateSettings();
  const activate = useActivateSettings();
  const [draft, setDraft] = useState(INITIAL_DRAFT);
  const [parseError, setParseError] = useState<string>();
  const [validatedDraft, setValidatedDraft] = useState<string>();
  const [fullRevisionConfirmed, setFullRevisionConfirmed] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const isCurrentValidation = validate.isSuccess && validatedDraft === draft;

  const handleEdit = (value: string) => {
    setDraft(value);
    setParseError(undefined);
    setValidatedDraft(undefined);
    setFullRevisionConfirmed(false);
    setActivateOpen(false);
    validate.reset();
    activate.reset();
  };

  const handleValidate = () => {
    setParseError(undefined);
    setValidatedDraft(undefined);
    validate.reset();
    activate.reset();
    let body: Record<string, unknown>;
    try {
      body = parseDraft(draft);
      if (Object.keys(body).length === 0) throw new Error('An empty object cannot replace the active revision. Paste the complete intended configuration.');
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'The draft is not valid JSON.');
      return;
    }
    validate.mutate(body, { onSuccess: () => setValidatedDraft(draft) });
  };

  const handleActivate = () => {
    if (!isCurrentValidation) return;
    const body = parseDraft(draft);
    activate.mutate(body, {
      onSuccess: (operation) => {
        setActivateOpen(false);
        feedback.accepted({
          title: 'Settings activation accepted',
          detail: operation?.resultRef
            ? `Atomic revision replacement accepted as ${operation.resultRef}.`
            : 'Atomic revision replacement was accepted. Runtime settings refresh automatically.',
          dedupeKey: 'settings:activate',
        });
      },
    });
  };

  return (
    <section className="settings-panel settings-draft" aria-labelledby="draft-revision-heading" data-od-id="settings-draft-revision">
      <header className="settings-panel-head">
        <div><h2 id="draft-revision-heading">Draft revision</h2><p>Validate the complete JSON payload before activation.</p></div>
        <span className={`status${isCurrentValidation ? ' status-active' : ''}`}><span className="dot" />{isCurrentValidation ? 'validated · not active' : 'not validated'}</span>
      </header>
      <div className="settings-draft-body">
        <div className="settings-payload">
          <div className="settings-subhead"><span>Draft payload</span><span className="mono">complete revision</span></div>
          <textarea className="settings-code-editor" aria-label="Draft settings JSON" spellCheck={false} value={draft} placeholder="Paste the complete settings JSON object" onChange={(event) => handleEdit(event.target.value)} />
        </div>
        <div className="settings-change-summary">
          <div className="settings-subhead"><span>Validation evidence</span><span className="num">current draft</span></div>
          {parseError && <SurfaceNotice kind="error" label="JSON parse error" title={parseError} announcement="polite" />}
          {validate.isPending && <div className="settings-validation"><span className="status"><span className="dot" />validating</span><p>Checking schema and policy constraints…</p></div>}
          {validate.isError && <div className="settings-validation settings-validation-error"><FailureNotice error={validate.error} title="Validation failed" /></div>}
          {isCurrentValidation && <div className="settings-validation"><span className="status status-active"><span className="dot" />validation passed</span><span className="mono">{validate.data.requestId}</span><p>The platform accepted this exact draft as valid. This is validation evidence, not activation.</p></div>}
          {!parseError && !validate.isPending && !validate.isError && !isCurrentValidation && <div className="settings-validation settings-validation-idle"><span className="status"><span className="dot" />awaiting validation</span><p>Edit the complete payload, then validate it against platform policy.</p></div>}
          {activate.isError && <div className="settings-validation settings-validation-error"><FailureNotice error={activate.error} title={(activate.error instanceof ApiFailure && activate.error.category === 'conflict') ? 'Activation conflict' : 'Activation was not accepted'} /></div>}
        </div>
      </div>
      <footer className="settings-panel-actions">
        <label className="flex max-w-xl items-start gap-2 text-[12px] leading-5 text-[var(--muted)]"><input className="mt-1" type="checkbox" checked={fullRevisionConfirmed} onChange={(event) => setFullRevisionConfirmed(event.target.checked)} /><span>I confirm this draft contains the complete intended configuration. Activation replaces the entire active revision atomically.</span></label>
        <div>
          <button className="btn" type="button" disabled={validate.isPending || activate.isPending} onClick={handleValidate}>{validate.isPending ? 'Validating…' : 'Validate draft'}</button>
          <button className="btn primary" type="button" disabled={!isCurrentValidation || !fullRevisionConfirmed || activate.isPending} onClick={() => setActivateOpen(true)}>{activate.isPending ? 'Submitting…' : 'Activate revision…'}</button>
        </div>
      </footer>
      {activateOpen && <TypedConfirmationDialog title="Activate settings revision" description={<><p>This atomically replaces the entire active platform configuration with the validated draft.</p><p>Validation request: <span className="mono">{validate.data?.requestId ?? 'unavailable'}</span></p></>} resourceId="complete settings revision" confirmValue="ACTIVATE" confirmLabel="Activate revision" pendingLabel="Submitting…" error={activate.error} isPending={activate.isPending} onCancel={() => setActivateOpen(false)} onConfirm={handleActivate} />}
    </section>
  );
}

function ConsoleSessionAside() {
  const session = loadSession();
  if (session === null) return null;
  return (
    <aside className="settings-session" aria-labelledby="console-session-heading" data-od-id="settings-console-session">
      <div className="settings-session-head"><div><span className="eyebrow !text-[var(--fg-2)]">Local console</span><h2 id="console-session-heading">Console session</h2></div><span className="status status-active"><span className="dot" />connected</span></div>
      <dl className="settings-session-facts">
        <div><dt>API base URL</dt><dd className="mono">{session.baseUrl}</dd></div>
        <div><dt>Key fingerprint</dt><dd className="mono">{keyFingerprint(session.apiKey)}</dd></div>
        <div><dt>Key kind</dt><dd><span className="pill">{session.keyKind}</span></dd></div>
        <div><dt>Connected</dt><dd className="ts" title={session.connectedAt}>{relativeTime(session.connectedAt) || absoluteTime(session.connectedAt)}</dd></div>
      </dl>
      <div className="settings-session-note"><span className="eyebrow">Credential boundary</span><p>The API key is masked after entry and never appears in URLs or logs.</p></div>
      <div className="settings-session-actions"><p className="help">Use Sign out from workspace navigation to clear this browser session.</p></div>
      {session.keyKind === 'admin' && <div className="settings-session-link"><Link className="flex min-h-11 items-center" to="/settings/api-keys">API key inventory <span aria-hidden="true">→</span></Link></div>}
    </aside>
  );
}

export function SettingsPage() {
  const settings = useSettings();
  const resource = settings.data?.resource;
  const unavailable = settings.data?.unavailable;
  const readState = useResilientReadState(settings, resource !== undefined);

  let main: React.ReactNode;
  if (readState.isInitialLoading) {
    main = <div className="settings-main-column"><div className="empty">Loading settings…</div></div>;
  } else if (readState.isInitialError) {
    main = <div className="settings-main-column">{isTransportError(readState.error)
      ? <div className="empty">Settings data is unavailable while the API reconnects.</div>
      : <InlineError error={readState.error} onRetry={settings.refetch} announce />}</div>;
  } else if (unavailable !== undefined || resource === undefined) {
    main = <div className="settings-main-column"><SurfaceNotice kind="warning" label="unavailable" title="Settings are unavailable" detail={unavailable?.reasonCode ? `Reason: ${unavailable.reasonCode}` : 'The platform did not return an active settings revision.'} /></div>;
  } else {
    main = <div className="settings-main-column">{readState.isStaleError && <InlineError error={readState.error} onRetry={settings.refetch} />}<ActiveConfiguration settings={resource} /><DraftRevision /></div>;
  }

  return (
    <div className="settings-screen">
      <PageHeader title="Settings" />
      {resource && <RuntimeStatus settings={resource} />}
      <div className="settings-layout">{main}<ConsoleSessionAside /></div>
    </div>
  );
}
