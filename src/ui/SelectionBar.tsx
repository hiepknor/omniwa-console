import { Button } from './Button';
import { Checkbox } from './ChoiceControls';
import { cn } from './cn';

/** Page-scoped bulk selection with a separate cross-page total and clear action. */
export function SelectionBar({
  scopeLabel,
  selectedCount,
  pageSelectedCount,
  pageSelectableCount,
  checked,
  indeterminate = false,
  disabled = false,
  clearDisabled = false,
  scopeDescription,
  clearLabel = 'Clear selection',
  ariaLabel = 'Selection controls',
  onTogglePage,
  onClear,
  className,
}: {
  scopeLabel: string;
  selectedCount: number;
  pageSelectedCount: number;
  pageSelectableCount: number;
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  clearDisabled?: boolean;
  scopeDescription?: string;
  clearLabel?: string;
  ariaLabel?: string;
  onTogglePage: (checked: boolean) => void;
  onClear: () => void;
  className?: string;
}) {
  const description = scopeDescription ?? `${pageSelectedCount} of ${pageSelectableCount} selectable on this page`;
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border border-line-strong bg-recessed px-3 py-2',
        'max-sm:grid-cols-1 max-sm:gap-2',
        className,
      )}
    >
      <Checkbox
        className="min-w-0 py-1"
        label={scopeLabel}
        description={description}
        checked={checked}
        indeterminate={indeterminate}
        disabled={disabled}
        onChange={(event) => onTogglePage(event.currentTarget.checked)}
      />
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-3 max-sm:justify-between">
        <span aria-live="polite" aria-atomic="true" className="whitespace-nowrap text-xs text-fg-3">
          <strong className="font-mono font-medium tabular-nums text-fg">{selectedCount}</strong> selected total
        </span>
        {selectedCount > 0 ? <Button disabled={clearDisabled} onClick={onClear}>{clearLabel}</Button> : null}
      </div>
    </div>
  );
}
