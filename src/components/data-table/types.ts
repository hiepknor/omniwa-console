import type { HTMLAttributes, ReactNode } from 'react';

export type DataTableColumnWidth =
  | 'selection'
  | 'identity'
  | 'identifier'
  | 'status'
  | 'numeric'
  | 'date'
  | 'action'
  | 'flex';

export type DataTableColumn<Row> = {
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  width?: DataTableColumnWidth;
  align?: 'start' | 'center' | 'end';
  sticky?: 'selection' | 'identity';
};

export type DataTableState<Row> =
  | { status: 'loading'; skeletonRows?: number }
  | { status: 'error'; error: unknown; onRetry: () => void }
  | { status: 'unavailable'; message: string }
  | { status: 'empty'; message: string }
  | { status: 'ready'; rows: readonly Row[] };

export type DataTableRowState = {
  active?: boolean;
  checked?: boolean;
};

export type DataTableProps<Row> = {
  caption: string;
  captionId?: string;
  columns: readonly DataTableColumn<Row>[];
  state: DataTableState<Row>;
  getRowKey: (row: Row, index: number) => string;
  getRowProps?: (row: Row, index: number) => HTMLAttributes<HTMLTableRowElement>;
  getRowState?: (row: Row, index: number) => DataTableRowState;
  renderMobileSummary: (row: Row, index: number) => ReactNode;
  footer?: ReactNode;
  layout?: 'compact' | 'standard' | 'wide';
  className?: string;
};
