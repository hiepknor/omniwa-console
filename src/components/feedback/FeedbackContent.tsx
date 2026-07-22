import { useState } from 'react';
import type { FeedbackAction, FeedbackKind } from './feedback-types';

export function FeedbackContent({
  kind,
  label,
  title,
  detail,
  requestId,
  action,
  onDismiss,
}: {
  kind: FeedbackKind;
  label?: string;
  title: string;
  detail?: string;
  requestId?: string;
  action?: FeedbackAction;
  onDismiss?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  // omniwa-go never returns a request id, so the row shows only when one exists.
  const requestIdLabel = requestId;
  const copyRequestId = async () => {
    if (!requestId) return;
    try {
      await navigator.clipboard.writeText(requestId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="feedback-content">
      <span className={`dot feedback-dot feedback-dot-${kind}`} aria-hidden="true"></span>
      <div className="feedback-copy">
        <span className="feedback-label">{label ?? kind}</span>
        <strong>{title}</strong>
        {detail && <p>{detail}</p>}
        {requestIdLabel && (
          <div className="feedback-request">
            <span className="mono max-[640px]:!truncate" title={requestId}>{requestIdLabel}</span>
            {requestId && <button className="max-[640px]:!min-h-11 max-[640px]:!px-3" type="button" onClick={() => { void copyRequestId(); }}>{copied ? 'Copied' : 'Copy'}</button>}
          </div>
        )}
        {action && <button className="btn sm feedback-action" type="button" onClick={action.run}>{action.label}</button>}
      </div>
      {onDismiss && <button className="feedback-dismiss" type="button" aria-label="Dismiss notification" onClick={onDismiss}>✕</button>}
    </div>
  );
}
