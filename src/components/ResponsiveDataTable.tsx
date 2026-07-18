import type { HTMLAttributes, ReactNode } from 'react';

export type ResponsiveTableColumn<Row> = {
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  className?: string;
};

export function ResponsiveDataTable<Row>({
  caption,
  captionId,
  columns,
  rows,
  getRowKey,
  getRowProps,
  renderMobileSummary,
}: {
  caption: string;
  captionId?: string;
  columns: readonly ResponsiveTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row, index: number) => string;
  getRowProps?: (row: Row, index: number) => HTMLAttributes<HTMLTableRowElement>;
  renderMobileSummary: (row: Row, index: number) => ReactNode;
}) {
  return (
    <div className="responsive-table-scroll">
      <table className="responsive-table">
        <caption id={captionId} className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={`responsive-table-desktop-cell${column.className ? ` ${column.className}` : ''}`}
              >
                {column.header}
              </th>
            ))}
            <th className="responsive-table-mobile-header" scope="col">Summary</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const rowProps = getRowProps?.(row, index);
            return (
              <tr key={getRowKey(row, index)} {...rowProps}>
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={`responsive-table-desktop-cell${column.className ? ` ${column.className}` : ''}`}
                  >
                    {column.cell(row)}
                  </td>
                ))}
                <td className="responsive-table-mobile-cell" colSpan={columns.length + 1}>
                  {renderMobileSummary(row, index)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function MobileRowSummary({
  identity,
  identifier,
  secondary,
  meta,
  actionLabel,
}: {
  identity: ReactNode;
  identifier?: ReactNode;
  secondary: ReactNode;
  meta?: ReactNode;
  actionLabel?: string;
}) {
  return (
    <div className="mobile-row-summary">
      <span className="mobile-row-identity">
        <span className="mobile-row-primary">{identity}</span>
        {identifier !== undefined && <span className="mobile-row-id mono">{identifier}</span>}
      </span>
      <span className="mobile-row-secondary">
        {secondary}
        {meta !== undefined && <span className="mobile-row-meta">{meta}</span>}
      </span>
      {actionLabel !== undefined && (
        <span className="mobile-row-disclosure" aria-label={actionLabel}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </span>
      )}
    </div>
  );
}
