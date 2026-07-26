import { buttonClassName } from './Button';

export function CloseButton({
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
      className={buttonClassName('ghost', 'size-9 shrink-0 p-0 max-sm:size-10')}
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
