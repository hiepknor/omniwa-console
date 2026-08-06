import { IconButton } from './IconButton';

export function CloseButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return <IconButton label={label} icon="close" disabled={disabled} onClick={onClick} />;
}
