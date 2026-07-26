import { buttonClassName } from './Button';
import { Icon } from './Icon';

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
      <Icon name="close" />
    </button>
  );
}
