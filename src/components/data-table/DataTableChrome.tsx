import type { HTMLAttributes, ReactNode } from 'react';

export function DataTableWorkspace({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={['data-table-workspace', className].filter(Boolean).join(' ')}>{children}</section>;
}

export function DataTableToolbar({ children, metadata }: { children: ReactNode; metadata?: ReactNode }) {
  return (
    <div className="data-table-toolbar">
      <div className="data-table-toolbar-primary">{children}</div>
      {metadata !== undefined && <div className="data-table-toolbar-meta">{metadata}</div>}
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
