import { useCallback, useEffect, useRef, useState } from 'react';
import { InlineError } from '@/components/InlineError';
import type { DataTableColumn, DataTableProps } from './types';

function columnClass<Row>(column: DataTableColumn<Row>, afterSelection = false): string {
  return [
    'responsive-table-desktop-cell',
    `responsive-table-column-${column.width ?? 'flex'}`,
    column.align ? `responsive-table-align-${column.align}` : '',
    column.sticky ? `responsive-table-sticky-${column.sticky}` : '',
    column.sticky === 'identity' ? 'responsive-table-sticky-identity' : '',
    column.sticky === 'selection' ? 'responsive-table-sticky-checkbox' : '',
    column.sticky === 'identity' && afterSelection ? 'responsive-table-sticky-after-checkbox' : '',
  ].filter(Boolean).join(' ');
}

function TableHeader<Row>({ columns }: { columns: readonly DataTableColumn<Row>[] }) {
  const hasSelectionColumn = columns.some((column) => column.sticky === 'selection');
  return (
    <thead>
      <tr>
        {columns.map((column) => (
          <th key={column.id} scope="col" className={columnClass(column, hasSelectionColumn)}>{column.header}</th>
        ))}
        <th className="responsive-table-mobile-header" scope="col">Summary</th>
      </tr>
    </thead>
  );
}

function SkeletonRows<Row>({ columns, count }: { columns: readonly DataTableColumn<Row>[]; count: number }) {
  const hasSelectionColumn = columns.some((column) => column.sticky === 'selection');
  return (
    <tbody aria-hidden="true">
      {Array.from({ length: count }, (_, rowIndex) => (
        <tr key={rowIndex} className="responsive-table-skeleton-row">
          {columns.map((column, columnIndex) => (
            <td key={column.id} className={columnClass(column, hasSelectionColumn)}>
              <span className="responsive-table-skeleton" style={{ width: `${Math.max(34, 78 - columnIndex * 9)}%` }} />
            </td>
          ))}
          <td className="responsive-table-mobile-cell">
            <span className="responsive-table-mobile-skeleton"><span /><span /></span>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

function StateRow({ children, columnCount }: { children: React.ReactNode; columnCount: number }) {
  return <tbody><tr><td className="responsive-table-state-cell" colSpan={columnCount + 1}>{children}</td></tr></tbody>;
}

export function DataTable<Row>({
  caption,
  captionId,
  columns,
  state,
  getRowKey,
  getRowProps,
  getRowState,
  renderMobileSummary,
  footer,
  layout = 'standard',
  className,
}: DataTableProps<Row>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });

  const updateOverflow = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    const maxScroll = Math.max(0, node.scrollWidth - node.clientWidth);
    setOverflow({
      left: node.scrollLeft > 1,
      right: node.scrollLeft < maxScroll - 1,
    });
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(node);
    const table = node.querySelector('table');
    if (table) observer.observe(table);
    node.addEventListener('scroll', updateOverflow, { passive: true });
    return () => {
      observer.disconnect();
      node.removeEventListener('scroll', updateOverflow);
    };
  }, [state, updateOverflow]);

  const rows = state.status === 'ready' ? state.rows : [];
  const hasSelectionColumn = columns.some((column) => column.sticky === 'selection');
  const regionClass = ['tablewrap', 'adaptive-table', 'warp-data-table', `responsive-table-layout-${layout}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={regionClass}
      tabIndex={0}
      role="region"
      aria-labelledby={captionId}
      aria-label={captionId ? undefined : caption}
      aria-busy={state.status === 'loading'}
    >
      <div
        className="responsive-table-scroll-shell"
        data-overflow-left={overflow.left}
        data-overflow-right={overflow.right}
      >
        <div ref={scrollRef} className="responsive-table-scroll">
          <table className="responsive-table">
            <caption id={captionId} className="visually-hidden">{caption}</caption>
            <TableHeader columns={columns} />
            {state.status === 'loading' ? (
              <SkeletonRows columns={columns} count={state.skeletonRows ?? 5} />
            ) : state.status === 'error' ? (
              <StateRow columnCount={columns.length}><InlineError error={state.error} onRetry={state.onRetry} className="responsive-table-error" /></StateRow>
            ) : state.status === 'unavailable' || state.status === 'empty' ? (
              <StateRow columnCount={columns.length}><div className="empty">{state.message}</div></StateRow>
            ) : (
              <tbody>
                {rows.map((row, index) => {
                  const rowProps = getRowProps?.(row, index) ?? {};
                  const rowState = getRowState?.(row, index);
                  const stateClasses = [rowState?.active ? 'is-active' : '', rowState?.checked ? 'is-checked' : ''].filter(Boolean).join(' ');
                  const mergedClassName = [rowProps.className, stateClasses].filter(Boolean).join(' ') || undefined;
                  return (
                    <tr
                      key={getRowKey(row, index)}
                      {...rowProps}
                      className={mergedClassName}
                      data-active={rowState?.active || undefined}
                      data-checked={rowState?.checked || undefined}
                    >
                      {columns.map((column) => (
                        <td key={column.id} className={columnClass(column, hasSelectionColumn)}>{column.cell(row)}</td>
                      ))}
                      <td className="responsive-table-mobile-cell" colSpan={columns.length + 1}>{renderMobileSummary(row, index)}</td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>
      </div>
      {footer}
    </div>
  );
}
