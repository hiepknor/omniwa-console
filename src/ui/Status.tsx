import type { ReactNode } from 'react';
import { cn } from './cn';

export type Tone = 'ok' | 'pending' | 'degraded' | 'failed' | 'info' | 'neutral';

const markColor: Record<Tone, string> = {
  ok: 'bg-ok',
  pending: 'bg-warn',
  degraded: 'bg-warn',
  failed: 'bg-danger',
  info: 'bg-accent',
  neutral: 'bg-fg-3',
};

/** Status = a 6px square mark + label. Never color alone. */
export function Status({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-xs text-fg-2', className)}>
      <span aria-hidden className={cn('size-[6px] shrink-0', markColor[tone])} />
      {children}
    </span>
  );
}
