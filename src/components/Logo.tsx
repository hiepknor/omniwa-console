/** OmniWA Console logomark: chat bubble carrying a delivery pulse. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#353534] text-[#faf9f6]"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: size * 0.54, height: size * 0.54 }}
        aria-hidden
      >
        <path d="M21 12a9 9 0 1 0-18 0c0 1.6.4 3.1 1.2 4.4L3 21l4.6-1.2A9 9 0 0 0 21 12z" />
        <path d="M7.5 12.5h2l1.5 2.5 2-6 1.5 3.5h2" />
      </svg>
    </span>
  );
}
