/** Shared on/off switch row used by instance and group configuration sections. */
export function SettingToggle({ label, hint, checked, disabled = false, pending = false, onChange }: {
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  pending?: boolean;
  onChange: () => void;
}) {
  return (
    <div className={`toggle-row${pending ? ' is-pending' : ''}`}>
      <span><strong>{label}</strong><small>{pending ? 'Updating…' : hint}</small></span>
      <button
        className={`toggle-switch${checked ? ' is-on' : ''}`}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${label}: ${checked ? 'on' : 'off'}`}
        disabled={disabled || pending}
        onClick={onChange}
      >
        <span aria-hidden="true" />
      </button>
    </div>
  );
}
