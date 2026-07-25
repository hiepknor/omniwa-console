/**
 * OmniWA Console logomark — the Warp warm-monochrome chat-and-pulse glyph from
 * `design/logo.svg`. Field and glyph use the shared `--accent` / `--fg` tokens
 * so the mark stays on-brand. Size it via the consumer's class (32px default).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" role="img" aria-label="OmniWA Console">
      <rect className="ui-v2-logo__field" width="32" height="32" rx="7" />
      <g className="ui-v2-logo__glyph" transform="translate(4 4)" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 0-18 0c0 1.6.4 3.1 1.2 4.4L3 21l4.6-1.2A9 9 0 0 0 21 12z" />
        <path d="M7.5 12.5h2l1.5 2.5 2-6 1.5 3.5h2" />
      </g>
    </svg>
  );
}
