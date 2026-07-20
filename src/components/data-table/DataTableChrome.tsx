import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';

export type DataTableActiveFilter = {
  id: string;
  label: string;
  onRemove: () => void;
};

export function DataTableWorkspace({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={['data-table-workspace', className].filter(Boolean).join(' ')}>{children}</section>;
}

export function DataTableToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="data-table-toolbar">
      <div className="data-table-toolbar-primary">{children}</div>
    </div>
  );
}

export const DataTableFilterTrigger = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { count: number }
>(function DataTableFilterTrigger({ count, children = 'Filters', className, ...props }, ref) {
  return (
    <button ref={ref} className={['mobile-filter-trigger', className].filter(Boolean).join(' ')} type="button" aria-haspopup="dialog" {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M7 12h10M10 17h4" /></svg>
      {children}
      {count > 0 && <span data-badge="count" className="filter-count num">{count}</span>}
    </button>
  );
});

export function DataTableActiveFilters({ filters }: { filters: readonly DataTableActiveFilter[] }) {
  if (filters.length === 0) return null;
  return (
    <div className="active-filter-row" aria-label="Active filters">
      {filters.map((filter) => (
        <button key={filter.id} data-badge="filter" className="chip" type="button" onClick={filter.onRemove}>
          {filter.label}<span className="x" aria-hidden="true">×</span>
        </button>
      ))}
    </div>
  );
}

export function DataTableFooter({ primary, actions }: { primary: ReactNode; actions?: ReactNode }) {
  return (
    <div className="table-foot">
      <div className="data-table-footer-primary">{primary}</div>
      {actions !== undefined && <div className="pagination">{actions}</div>}
    </div>
  );
}
