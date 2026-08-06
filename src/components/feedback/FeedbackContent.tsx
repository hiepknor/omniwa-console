import { useState } from 'react';
import { Button } from '@/ui/Button';
import { CloseButton } from '@/ui/CloseButton';
import { IconButton } from '@/ui/IconButton';
import { statusMarkStyle, type StatusMarkTone } from '@/ui/statusMarks';
import type { FeedbackAction, FeedbackKind } from './feedback-types';

const markTone: Record<FeedbackKind, StatusMarkTone> = {
  completed: 'ok',
  info: 'info',
  accepted: 'pending',
  warning: 'degraded',
  error: 'failed',
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
      <span aria-hidden className="mt-1 size-2.5 shrink-0" style={statusMarkStyle[markTone[kind]]} />
      <div className="grid gap-1 min-w-0 flex-1">
        <span className="text-[11px] font-medium uppercase tracking-wider text-fg-3">{label ?? kind}</span>
        <strong className="text-[13px] font-semibold text-fg">{title}</strong>
        {detail && <p className="text-xs text-fg-2">{detail}</p>}
        {requestId && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-xs text-fg-3 truncate" title={requestId}>{requestId}</span>
            <IconButton className="size-7 max-sm:size-9" icon={copied ? 'check' : 'copy'} label={copied ? 'Request ID copied' : 'Copy request ID'} onClick={() => { void copyRequestId(); }} />
          </div>
        )}
        {action && <Button className="mt-1 h-8 justify-self-start text-xs" onClick={action.run}>{action.label}</Button>}
      </div>
      {onDismiss && <CloseButton label="Dismiss notification" onClick={onDismiss} />}
    </div>
  );
}
