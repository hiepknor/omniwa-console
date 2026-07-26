import { useState, type CSSProperties } from 'react';
import { CloseButton } from '@/ui/CloseButton';
import type { FeedbackAction, FeedbackKind } from './feedback-types';

const mark: Record<FeedbackKind, CSSProperties> = {
  completed: { background: '#111' },
  info: { background: '#111' },
  accepted: { background: 'radial-gradient(circle, #111 45%, transparent 47%)', backgroundSize: '3px 3px' },
  warning: { background: 'repeating-linear-gradient(45deg, #111 0 1px, transparent 1px 3px)' },
  error: { background: 'linear-gradient(45deg, transparent 42%, #fff 42% 58%, transparent 58%), #111' },
};

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
    <div className="flex items-start gap-3 p-3">
      <span aria-hidden className="mt-1 size-2 shrink-0" style={mark[kind]} />
      <div className="grid gap-1 min-w-0 flex-1">
        <span className="text-[11px] font-medium uppercase tracking-wider text-fg-3">{label ?? kind}</span>
        <strong className="text-[13px] font-semibold text-fg">{title}</strong>
        {detail && <p className="text-xs text-fg-2">{detail}</p>}
        {requestId && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-xs text-fg-3 truncate" title={requestId}>{requestId}</span>
            <button type="button" className="shrink-0 h-6 px-2 text-[11px] border border-line hover:bg-elevated hover:border-line-strong" onClick={() => { void copyRequestId(); }}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
        )}
        {action && <button type="button" className="justify-self-start mt-1 h-8 px-2.5 text-xs border border-line hover:bg-elevated hover:border-line-strong" onClick={action.run}>{action.label}</button>}
      </div>
      {onDismiss && <CloseButton label="Dismiss notification" onClick={onDismiss} />}
    </div>
  );
}
