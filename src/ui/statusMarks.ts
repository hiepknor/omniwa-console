import type { CSSProperties } from 'react';

export type StatusMarkTone = 'ok' | 'info' | 'pending' | 'degraded' | 'failed' | 'neutral';

const ink = '#111';

/** Frozen monochrome screentones shared by status, notices, and feedback. */
export const statusMarkStyle: Record<StatusMarkTone, CSSProperties> = {
  ok: { background: ink },
  info: { background: 'linear-gradient(to bottom, #111 0 35%, transparent 35% 65%, #111 65% 100%)' },
  pending: { background: 'radial-gradient(circle, #111 45%, transparent 47%)', backgroundSize: '3px 3px' },
  degraded: { background: 'repeating-linear-gradient(45deg, #111 0 1px, transparent 1px 3px)' },
  failed: { background: 'linear-gradient(45deg, transparent 42%, #fff 42% 58%, transparent 58%), #111' },
  neutral: { background: 'transparent', border: '1px solid var(--color-fg-3)' },
};
