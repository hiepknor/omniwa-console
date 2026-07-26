export function OverlayCloseButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={[
        'grid h-full min-h-9 w-9 shrink-0 place-items-center border-l border-line bg-surface text-fg-2 max-sm:w-10',
        'transition-colors hover:border-fg hover:bg-fg hover:text-bg motion-reduce:transition-none',
        'focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-accent',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-elevated disabled:text-fg-3 disabled:opacity-60',
      ].join(' ')}
    >
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="size-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="square"
      >
        <path d="m4 4 8 8M12 4l-8 8" />
      </svg>
    </button>
  );
}
