import { useEffect, useRef, type ChangeEvent, type ReactNode } from 'react';

export function DataTableSelectionControl({
  label,
  checked,
  indeterminate = false,
  onChange,
}: {
  label: string;
  checked: boolean;
  indeterminate?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className="data-table-selection-control">
      <input ref={inputRef} type="checkbox" checked={checked} onChange={onChange} />
      <span className="visually-hidden">{label}</span>
    </label>
  );
}

export function DataTableSelectionBar({
  count,
  children,
  onClear,
}: {
  count: number;
  children: ReactNode;
  onClear: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="data-table-selection-bar" role="region" aria-label={`${count} selected rows`}>
      <span><span className="num">{count}</span> selected</span>
      <div className="data-table-selection-actions">{children}</div>
      <button className="btn" type="button" onClick={onClear}>Clear selection</button>
    </div>
  );
}
