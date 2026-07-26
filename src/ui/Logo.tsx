import { cn } from './cn';

/**
 * OmniWA logomark (chat bubble + activity pulse) as a square ink tile with a
 * paper-white glyph — the brand mark rendered in the manga theme.
 * Glyph paths mirror design/logo.svg.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-7 shrink-0', className)}>
      <rect width="32" height="32" className="fill-fg" />
      <g
        transform="translate(4 4)"
        fill="none"
        className="stroke-bg"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 1 0-18 0c0 1.6.4 3.1 1.2 4.4L3 21l4.6-1.2A9 9 0 0 0 21 12z" />
        <path d="M7.5 12.5h2l1.5 2.5 2-6 1.5 3.5h2" />
      </g>
    </svg>
  );
}
