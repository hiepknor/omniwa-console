import type { ReactNode } from 'react';
import { cn } from './cn';
import { statusMarkStyle } from './statusMarks';

type Kind = 'info' | 'loading' | 'empty' | 'error';

const markTone = { info: 'info', loading: 'pending', empty: 'neutral', error: 'failed' } as const;

/** Honest inline state: loading / empty / error, with optional requestId + action. */
export function StateNotice({
  kind = 'info',
  title,
  detail,
  requestId,
  action,
  className,
}: {
  kind?: Kind;
  title: ReactNode;
  detail?: ReactNode;
  requestId?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border border-line bg-elevated p-3', className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 shrink-0" style={statusMarkStyle[markTone[kind]]} />
          <strong className="text-sm font-semibold text-fg">{title}</strong>
        </div>
        {detail ? <p className="mt-1 text-sm text-fg-2">{detail}</p> : null}
        {requestId ? <p className="mt-1 font-mono text-xs text-fg-3">requestId: {requestId}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
