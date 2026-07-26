import type { CSSProperties, ReactNode } from 'react';
import { cn } from './cn';

export type Tone = 'ok' | 'pending' | 'degraded' | 'failed' | 'info' | 'neutral';

/*
 * Black-and-white comic: status is differentiated by manga-style screentone,
 * never by hue. Every mark is white ink on black; the fill *pattern* carries
 * the meaning, and the label always states it.
 *   ok / info → solid ink        pending → halftone dots
 *   degraded  → diagonal hatch    failed  → ink with a black slash (cancelled)
 *   neutral   → hollow outline
 */
const ink = '#111';
const markStyle: Record<Tone, CSSProperties> = {
  ok: { background: ink },
  info: { background: ink },
  pending: { background: 'radial-gradient(circle, #111 45%, transparent 47%)', backgroundSize: '3px 3px' },
  degraded: { background: 'repeating-linear-gradient(45deg, #111 0 1px, transparent 1px 3px)' },
  failed: { background: 'linear-gradient(45deg, transparent 42%, #fff 42% 58%, transparent 58%), #111' },
  neutral: { background: 'transparent', border: '1px solid var(--color-fg-3)' },
};

/** Status = an 8px screentone mark + label. Never color alone, never hue. */
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
      <span aria-hidden className="size-2 shrink-0" style={markStyle[tone]} />
      {children}
    </span>
  );
}
