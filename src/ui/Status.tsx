import type { ReactNode } from 'react';
import { cn } from './cn';
import { statusMarkStyle, type StatusMarkTone } from './statusMarks';

export type Tone = StatusMarkTone;

/*
 * Black-and-white comic: status is differentiated by manga-style screentone,
 * never by hue. The fill pattern carries
 * the meaning, and the label always states it.
 *   ok → solid ink               info → split ink
 *   pending → halftone dots
 *   degraded  → diagonal hatch    failed  → ink with a white slash (cancelled)
 *   neutral   → hollow outline
 */
/** Status = a framed ink stamp with a screentone cell + explicit label. */
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
    <span data-tone={tone} className={cn('inline-grid min-h-6 max-w-full justify-self-start grid-cols-[20px_minmax(0,1fr)] items-stretch border border-line bg-surface align-middle text-[11px] font-medium leading-4 text-fg', tone === 'failed' && 'border-line-strong', className)}>
      <span aria-hidden className="grid place-items-center border-r border-line bg-recessed">
        <span className="size-2.5 shrink-0" style={statusMarkStyle[tone]} />
      </span>
      <span className="min-w-0 break-words px-2 py-1">{children}</span>
    </span>
  );
}
