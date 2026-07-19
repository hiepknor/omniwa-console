import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { InlineError } from '@/components/InlineError';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { deferTransportErrorToWorkspace } from '@/components/feedback/feedback-policy';
import { MobileRowSummary } from './MobileRowSummary';
import type { DataTableColumn, DataTableProps } from './types';

function columnClass<Row>(column: DataTableColumn<Row>, afterSelection = false): string {
  return [
    'responsive-table-desktop-cell',
    `responsive-table-column-${column.size ?? 'flex'}`,
    column.kind ? `responsive-table-kind-${column.kind}` : '',
    column.align ? `responsive-table-align-${column.align}` : '',
    column.sticky ? `responsive-table-sticky-${column.sticky}` : '',
    column.sticky === 'identity' ? 'responsive-table-sticky-identity' : '',
    column.sticky === 'selection' ? 'responsive-table-sticky-checkbox' : '',
    column.sticky === 'identity' && afterSelection ? 'responsive-table-sticky-after-checkbox' : '',
  ].filter(Boolean).join(' ');
}

function renderMobileCell<Row>(column: DataTableColumn<Row> | undefined, row: Row) {
  if (!column) return undefined;
  return column.mobileCell ? column.mobileCell(row) : column.cell(row);
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
  getRowActionLabel,
  footer,
  refreshIssue,
  layout = 'standard',
  appearance = 'default',
  attached = false,
}: DataTableProps<Row>) {
  const location = useLocation();
  const { transport } = useFeedback();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });
  const rowCount = state.status === 'ready' ? state.rows.length : 0;

  const updateOverflow = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    const maxScroll = Math.max(0, node.scrollWidth - node.clientWidth);
    const next = {
      left: node.scrollLeft > 1,
      right: node.scrollLeft < maxScroll - 1,
    };
    setOverflow((current) => current.left === next.left && current.right === next.right ? current : next);
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
  }, [state.status, rowCount, columns.length, updateOverflow]);

  const rows = state.status === 'ready' ? state.rows : [];
  const workspaceOwnsError = state.status === 'error' && deferTransportErrorToWorkspace({
    error: state.error,
    offline: transport.status === 'offline',
    pathname: location.pathname,
  });
  const hasSelectionColumn = columns.some((column) => column.sticky === 'selection');
  const mobileColumns = {
    selection: columns.find((column) => column.sticky === 'selection'),
    identity: columns.find((column) => column.mobile === 'identity') ?? columns.find((column) => column.sticky !== 'selection' && column.mobile !== 'hidden'),
    identifier: columns.find((column) => column.mobile === 'identifier'),
    secondary: columns.find((column) => column.mobile === 'secondary'),
    meta: columns.find((column) => column.mobile === 'meta'),
  };
  const regionClass = [
    'tablewrap',
    'adaptive-table',
    'warp-data-table',
    `responsive-table-layout-${layout}`,
    `warp-data-table-${appearance}`,
    attached ? 'warp-data-table-attached' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={regionClass}
      tabIndex={overflow.left || overflow.right ? 0 : undefined}
      role="region"
      aria-labelledby={captionId}
      aria-label={captionId ? undefined : caption}
      aria-busy={state.status === 'loading'}
    >
      {refreshIssue && (
        <InlineError
          error={refreshIssue.error}
          onRetry={refreshIssue.onRetry}
          className="overview-error"
        />
      )}
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
              <StateRow columnCount={columns.length}>{workspaceOwnsError
                ? <div className="empty">Data is unavailable while the API reconnects.</div>
                : <InlineError error={state.error} onRetry={state.onRetry} className="responsive-table-error" />}</StateRow>
            ) : state.status === 'unavailable' || state.status === 'empty' ? (
              <StateRow columnCount={columns.length}><div className="empty">{state.message}</div></StateRow>
            ) : (
              <tbody>
                {rows.map((row, index) => {
                  const rowProps = getRowProps?.(row, index) ?? {};
                  const rowState = getRowState?.(row, index);
                  const actionLabel = getRowActionLabel?.(row, index);
                  const stateClasses = [rowState?.active ? 'is-active' : '', rowState?.checked ? 'is-checked' : ''].filter(Boolean).join(' ');
                  const mergedClassName = [rowProps.className, stateClasses].filter(Boolean).join(' ') || undefined;
                  return (
                    <tr
                      key={getRowKey(row, index)}
                      {...rowProps}
                      className={mergedClassName}
                      data-active={rowState?.active || undefined}
                      data-checked={rowState?.checked || undefined}
                      aria-label={rowProps['aria-label'] ?? actionLabel}
                    >
                      {columns.map((column) => (
                        <td key={column.id} className={columnClass(column, hasSelectionColumn)}>{column.cell(row)}</td>
                      ))}
                      <td className="responsive-table-mobile-cell" colSpan={columns.length + 1}>
                        {renderMobileSummary ? renderMobileSummary(row, index) : (
                          <MobileRowSummary
                            selection={renderMobileCell(mobileColumns.selection, row)}
                            identity={renderMobileCell(mobileColumns.identity, row) ?? '—'}
                            identifier={renderMobileCell(mobileColumns.identifier, row)}
                            secondary={renderMobileCell(mobileColumns.secondary, row)}
                            meta={renderMobileCell(mobileColumns.meta, row)}
                            actionLabel={actionLabel}
                          />
                        )}
                      </td>
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
