import { useCallback, useEffect, useId, useState } from 'react';
import { Link, useBeforeUnload, useBlocker } from 'react-router-dom';
import { ApiFailure } from '@/api/envelopes';
import type { SettingsResource } from '@/api/settings';
import { CategoryPill, StatusIndicator } from '@/components/badges';
import { PageHeader } from '@/components/PageHeader';
import { InlineError } from '@/components/InlineError';
import { TypedConfirmationDialog } from '@/components/TypedConfirmationDialog';
import { ConfirmationDialog } from '@/components/dialog/ConfirmationDialog';
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
      announcement="polite"
    />
  );
}

function ActiveConfiguration({ settings }: { settings: SettingsResource }) {
  const fields = [
    ['Revision ID', settings.id],
    ['Profile', settings.profile],
    ['Updated', absoluteTime(settings.updatedAt)],
  ] as const;

  return (
    <section className="settings-panel" aria-labelledby="active-configuration-heading" data-od-id="settings-active-configuration">
      <header className="settings-panel-head">
        <div>
          <span className="eyebrow">Platform posture</span>
          <h2 id="active-configuration-heading">Active configuration</h2>
          <p>The active revision governs platform-side configuration.</p>
        </div>
        <StatusIndicator dotClass={settings.status === 'active' ? 'dot-ok' : 'dot-info'}>{settings.status ?? 'unknown'}</StatusIndicator>
      </header>
      <dl className="grid grid-cols-3 max-[640px]:grid-cols-1">
        {fields.map(([label, value]) => (
          <div className="min-w-0 border-r border-[var(--border-subtle)] !px-4 !py-3 last:border-r-0 max-[640px]:border-b max-[640px]:border-r-0 max-[640px]:last:border-b-0" key={label}>
            <dt className="text-[10px] uppercase tracking-[1.2px] text-[var(--muted)]">{label}</dt>
            <dd className="mt-1 min-w-0 font-mono text-xs leading-5 text-[var(--fg)] [overflow-wrap:anywhere]" title={value}>{value ?? 'Not reported'}</dd>
          </div>
        ))}
      </dl>
      <p className="help settings-projection-note">The full configuration payload is not projected through the public read. Drafts must contain the entire intended revision.</p>
    </section>
  );
}

type AcceptedActivation = {
  requestId?: string;
  resultRef?: string;
  baselineRevisionId?: string;
  baselineUpdatedAt?: string;
};

function DraftRevision({ settings }: { settings: SettingsResource }) {
  const feedback = useFeedback();
  const validate = useValidateSettings();
  const activate = useActivateSettings();
  const payloadInputId = useId();
  const [draft, setDraft] = useState(INITIAL_DRAFT);
  const [parseError, setParseError] = useState<string>();
  const [validatedDraft, setValidatedDraft] = useState<string>();
  const [fullRevisionConfirmed, setFullRevisionConfirmed] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [submission, setSubmission] = useState<AcceptedActivation>();
  const isCurrentValidation = validate.isSuccess && validate.data.disposition === 'completed' && validatedDraft === draft;
  // omniwa-go commands are always synchronous; there is no accepted/pending disposition.
  const isCurrentValidationPending = false;
  const hasUnsavedDraft = draft.trim().length > 0 && submission === undefined;
  const blocker = useBlocker(hasUnsavedDraft);

  useBeforeUnload(useCallback((event) => {
    if (!hasUnsavedDraft) return;
    event.preventDefault();
    event.returnValue = '';
  }, [hasUnsavedDraft]));

  const resetEditor = () => {
    setDraft(INITIAL_DRAFT);
    setParseError(undefined);
    setValidatedDraft(undefined);
    setFullRevisionConfirmed(false);
    setActivateOpen(false);
    setSubmission(undefined);
    validate.reset();
    activate.reset();
  };

  useEffect(() => {
    if (submission === undefined) return;
    const observedByReference = submission.resultRef !== undefined && settings.id === submission.resultRef;
    const observedByRevision = (
      settings.id !== submission.baselineRevisionId || settings.updatedAt !== submission.baselineUpdatedAt
    );
    if (!observedByReference && !observedByRevision) return;
    feedback.completed({
      title: 'Settings revision active',
      detail: 'The active settings projection now reflects the submitted revision.',
      requestId: submission.requestId,
      dedupeKey: 'settings:activate',
    });
    resetEditor();
  }, [feedback, settings.id, settings.updatedAt, submission]);

  const handleEdit = (value: string) => {
    if (submission !== undefined) return;
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
    if (!isCurrentValidation || submission !== undefined) return;
    const body = parseDraft(draft);
    activate.mutate(body, {
      onSuccess: (result) => {
        setActivateOpen(false);
        feedback.command(result.disposition, {
          action: 'Settings activation',
          acceptedDetail: result.operation?.resultRef
            ? `Atomic revision replacement was accepted as ${result.operation.resultRef}.`
            : 'Atomic revision replacement was accepted. Runtime settings refresh automatically.',
          completedDetail: result.operation?.resultRef
            ? `Atomic revision replacement completed as ${result.operation.resultRef}.`
            : 'Atomic revision replacement completed. Runtime settings refresh automatically.',
          requestId: result.requestId,
          dedupeKey: 'settings:activate',
        });
        if (result.disposition === 'completed') {
          resetEditor();
        } else {
          setFullRevisionConfirmed(false);
          setSubmission({
            requestId: result.requestId,
            resultRef: result.operation?.resultRef,
            baselineRevisionId: settings.id,
            baselineUpdatedAt: settings.updatedAt,
          });
        }
      },
    });
  };

  const draftStatus = submission !== undefined
    ? { dot: 'dot-pending', label: 'activation accepted' }
    : isCurrentValidation
      ? { dot: 'dot-ok', label: 'validated · not active' }
      : isCurrentValidationPending
        ? { dot: 'dot-pending', label: 'validation pending' }
        : { dot: 'dot-muted', label: 'not validated' };

  return (
    <section className="settings-panel settings-draft" aria-labelledby="draft-revision-heading" data-od-id="settings-draft-revision">
      <header className="settings-panel-head">
        <div><h2 id="draft-revision-heading">Draft revision</h2><p>Validate the complete JSON payload before activation.</p></div>
        <StatusIndicator dotClass={draftStatus.dot}>{draftStatus.label}</StatusIndicator>
      </header>
      <div className="settings-draft-body">
        <div className="settings-payload">
          <div className="settings-subhead"><label htmlFor={payloadInputId}>Draft payload</label><span className="mono">complete revision</span></div>
          <textarea className="settings-code-editor" id={payloadInputId} spellCheck={false} value={draft} placeholder="Paste the complete settings JSON object" onChange={(event) => handleEdit(event.target.value)} disabled={submission !== undefined} />
        </div>
        <div className="settings-change-summary">
          <div className="settings-subhead"><span>Validation evidence</span><span className="num">current draft</span></div>
          {submission !== undefined && <div className="settings-validation"><StatusIndicator dotClass="dot-pending">activation accepted</StatusIndicator><span className="mono">{submission.requestId ?? 'Request ID unavailable'}</span><p>This exact draft is locked while the platform activates it. Start a new draft only if you no longer need to monitor this submission here.</p></div>}
          {parseError && <SurfaceNotice kind="error" label="JSON parse error" title={parseError} announcement="polite" />}
          {validate.isPending && <div className="settings-validation"><StatusIndicator dotClass="dot-pending">validating</StatusIndicator><p>Checking schema and policy constraints…</p></div>}
          {validate.isError && <div className="settings-validation settings-validation-error"><FailureNotice error={validate.error} title="Validation failed" /></div>}
          {submission === undefined && isCurrentValidation && <div className="settings-validation"><StatusIndicator dotClass="dot-ok">validation passed</StatusIndicator><span className="mono">{validate.data.requestId ?? 'Request ID unavailable'}</span><p>The platform accepted this exact draft as valid. This is validation evidence, not activation.</p></div>}
          {submission === undefined && !parseError && !validate.isPending && !validate.isError && !isCurrentValidation && !isCurrentValidationPending && <div className="settings-validation settings-validation-idle"><StatusIndicator dotClass="dot-muted">awaiting validation</StatusIndicator><p>Edit the complete payload, then validate it against platform policy.</p></div>}
          {activate.isError && <div className="settings-validation settings-validation-error"><FailureNotice error={activate.error} title={(activate.error instanceof ApiFailure && activate.error.category === 'conflict') ? 'Activation conflict' : 'Activation was not accepted'} /></div>}
        </div>
      </div>
      <footer className="settings-panel-actions max-[1100px]:[&_.btn]:min-h-11 max-[1100px]:[&_.btn]:min-w-11 pointer-coarse:[&_.btn]:min-h-11 pointer-coarse:[&_.btn]:min-w-11">
        {submission === undefined
          ? <label className="flex max-w-xl items-start gap-2 text-[12px] leading-5 text-[var(--muted)]"><input className="mt-1" type="checkbox" checked={fullRevisionConfirmed} onChange={(event) => setFullRevisionConfirmed(event.target.checked)} /><span>I confirm this draft contains the complete intended configuration. Activation replaces the entire active revision atomically.</span></label>
          : <p className="max-w-xl text-xs leading-5 text-[var(--muted)]">Activation has been submitted. Duplicate submission is disabled.</p>}
        <div>
          {submission !== undefined
            ? <button className="btn" type="button" onClick={resetEditor}>Start new draft</button>
            : <><button className="btn" type="button" disabled={validate.isPending || activate.isPending} onClick={handleValidate}>{validate.isPending ? 'Validating…' : 'Validate draft'}</button><button className="btn primary" type="button" disabled={!isCurrentValidation || !fullRevisionConfirmed || activate.isPending} onClick={() => setActivateOpen(true)}>{activate.isPending ? 'Submitting…' : 'Activate revision'}</button></>}
        </div>
      </footer>
      {activateOpen && <TypedConfirmationDialog title="Activate settings revision" description={<><p>This atomically replaces the entire active platform configuration with the validated draft.</p><p>Validation request: <span className="mono">{validate.data?.requestId ?? 'unavailable'}</span></p></>} resourceId={validate.data?.requestId ?? 'Validation request unavailable'} confirmValue="ACTIVATE" confirmLabel="Activate revision" pendingLabel="Submitting…" intent="primary" error={activate.error} isPending={activate.isPending} onCancel={() => setActivateOpen(false)} onConfirm={handleActivate} />}
      {blocker.state === 'blocked' && <ConfirmationDialog eyebrow="Unsaved draft" title="Discard settings draft?" description={<p>This draft has not been submitted. Leaving this page removes it from the browser without changing the active platform configuration.</p>} confirmLabel="Discard and leave" intent="danger" onCancel={() => blocker.reset()} onConfirm={() => blocker.proceed()} />}
    </section>
  );
}

function ConsoleSessionAside() {
  const session = loadSession();
  const [expanded, setExpanded] = useState(() => !window.matchMedia('(max-width: 640px)').matches);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const sync = () => setExpanded(!media.matches);
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  if (session === null) return null;
  return (
    <aside className="settings-session" aria-labelledby="console-session-heading" data-od-id="settings-console-session">
      <button className="settings-session-head w-full text-left pointer-coarse:min-h-11" type="button" aria-expanded={expanded} aria-controls="settings-session-content" onClick={() => setExpanded((current) => !current)}>
        <div><span className="eyebrow !text-[var(--fg-2)]">Local console</span><h2 id="console-session-heading">Console session</h2></div>
        <span className="flex items-center gap-3"><StatusIndicator dotClass="dot-ok">connected</StatusIndicator><span className="text-[var(--muted)] transition-transform" aria-hidden="true">{expanded ? '−' : '+'}</span></span>
      </button>
      <div id="settings-session-content" hidden={!expanded}>
        <dl className="settings-session-facts">
          <div><dt>API base URL</dt><dd className="mono">{session.baseUrl}</dd></div>
          <div><dt>Key fingerprint</dt><dd className="mono">{keyFingerprint(session.apiKey)}</dd></div>
          <div><dt>Key kind</dt><dd><CategoryPill>{session.keyKind}</CategoryPill></dd></div>
          <div><dt>Connected</dt><dd className="ts" title={session.connectedAt}>{relativeTime(session.connectedAt) || absoluteTime(session.connectedAt)}</dd></div>
        </dl>
        <div className="settings-session-note"><span className="eyebrow">Credential boundary</span><p>The API key is masked after entry and never appears in URLs or logs.</p></div>
        <div className="settings-session-actions"><p className="help">Use Sign out from workspace navigation to clear this browser session.</p></div>
        {session.keyKind === 'admin' && <div className="settings-session-link"><Link className="flex min-h-11 items-center justify-between gap-4" to="/settings/api-keys"><span>API key inventory</span><span aria-hidden="true">→</span></Link></div>}
      </div>
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
    main = <div className="settings-main-column"><SurfaceNotice kind="warning" label="unavailable" title="Settings are not available on OmniWA GO" detail="OmniWA GO exposes only per-instance advanced settings, not a global settings surface." /></div>;
  } else {
    main = <div className="settings-main-column">{readState.isStaleError && <InlineError error={readState.error} onRetry={settings.refetch} />}<ActiveConfiguration settings={resource} /><DraftRevision settings={resource} /></div>;
  }

  return (
    <div className="settings-screen">
      <PageHeader title="Settings" />
      <div className="settings-layout">{main}<ConsoleSessionAside /></div>
    </div>
  );
}
