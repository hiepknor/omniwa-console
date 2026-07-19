import type { HTMLAttributes, ReactNode } from 'react';

export type DataTableColumnSize =
  | 'selection'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'flex';

export type DataTableColumnKind =
  | 'identity'
  | 'identifier'
  | 'status'
  | 'numeric'
  | 'date'
  | 'action';

export type DataTableColumn<Row> = {
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  size?: DataTableColumnSize;
  kind?: DataTableColumnKind;
  align?: 'start' | 'center' | 'end';
  sticky?: 'selection' | 'identity';
  mobile?: 'identity' | 'identifier' | 'secondary' | 'meta' | 'hidden';
  mobileCell?: (row: Row) => ReactNode;
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
  renderMobileSummary?: (row: Row, index: number) => ReactNode;
  getRowActionLabel?: (row: Row, index: number) => string | undefined;
  footer?: ReactNode;
  refreshIssue?: { error: unknown; onRetry: () => void };
  layout?: 'compact' | 'standard' | 'wide';
  appearance?: 'default' | 'subtle';
  attached?: boolean;
};
