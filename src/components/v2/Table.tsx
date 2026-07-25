import type { ReactNode } from 'react';

export type Column<T> = {
  /** Header cell content. When a string, it also becomes the row cell's `data-label`. */
  header: string;
  /** Row cell content for one item. */
  cell: (item: T) => ReactNode;
  /** Overrides the compact `data-label` when the header is not the right label. */
  label?: string;
  /** Optional `class` for the body cell (e.g. `ui-v2-mono`). */
  className?: string;
  /** Optional `title` (hover tooltip) for the body cell, derived per row. */
  title?: (item: T) => string | undefined;
};

/**
 * Shared v2 data table. Emits the canonical `ui-v2-table` markup — a focusable
 * scroll wrapper, a visually hidden caption, a header row, and body rows whose
 * cells carry `data-label` for the compact card layout — so every v2 list keeps
 * one responsive, accessible geometry. Features own the typed columns and cell
 * rendering; selection and empty/loading states stay in the page.
 */
export function Table<T>({
  columns,
  rows,
  rowKey,
  caption,
  ariaLabel,
  className,
  selectedKey,
}: {
  columns: Array<Column<T>>;
  rows: readonly T[];
  rowKey: (item: T) => string;
  caption: string;
  ariaLabel: string;
  className?: string;
  selectedKey?: string;
}) {
  return (
    <div className="ui-v2-table-wrap" tabIndex={0} aria-label={ariaLabel}>
      <table className={className ? `ui-v2-table ${className}` : 'ui-v2-table'}>
        <caption className="ui-v2-visually-hidden">{caption}</caption>
        <thead>
          <tr>{columns.map((column, index) => <th key={index}>{column.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = rowKey(row);
            return (
              <tr key={key} data-selected={(selectedKey !== undefined && key === selectedKey) || undefined}>
                {columns.map((column, index) => <td key={index} data-label={column.label ?? column.header} className={column.className} title={column.title?.(row)}>{column.cell(row)}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
