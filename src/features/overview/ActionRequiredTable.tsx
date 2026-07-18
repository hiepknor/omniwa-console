import { Link, useNavigate } from 'react-router-dom';
import {
  DataTable,
  DataTableFooter,
  DataTableWorkspace,
  MobileRowSummary,
  type DataTableColumn,
  type DataTableState,
} from '@/components/data-table';
import { relativeTime } from '@/lib/format';
import { useActionRequiredItems, type ActionRequiredItem } from './hooks';

function statusDot(status: string | undefined): string {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'dot-pending';
    case 'degraded':
      return 'dot-degraded';
    case 'failed':
    case 'dead':
      return 'dot-failed';
    default:
      return 'dot-info';
  }
}

function itemAction(item: ActionRequiredItem) {
  const subjectRef = safeSubjectRef(item.subjectRef);
  if (subjectRef === undefined) return null;
  const separatorIndex = subjectRef.indexOf(':');
  if (separatorIndex === -1) return null;
  const prefix = subjectRef.slice(0, separatorIndex);
  const id = subjectRef.slice(separatorIndex + 1);
  if (!id) return null;
  switch (prefix) {
    case 'instance':
      return { to: `/instances/${id}`, label: 'Open' };
    case 'webhook':
      return { to: `/webhooks/${id}`, label: 'Review' };
    case 'worker-job':
    case 'job':
      return { to: `/queue?job=${encodeURIComponent(id)}`, label: 'Inspect' };
    default:
      return null;
  }
}

function paginationTotal(pagination: unknown, fallback: number): number {
  if (typeof pagination !== 'object' || pagination === null || !('total' in pagination)) return fallback;
  const total = pagination.total;
  return typeof total === 'number' ? total : fallback;
}

function safeSubjectRef(subjectRef: string | undefined): string | undefined {
  if (subjectRef === undefined) return undefined;
  const separatorIndex = subjectRef.indexOf(':');
  const identity = separatorIndex === -1 ? subjectRef : subjectRef.slice(separatorIndex + 1);
  if (identity.includes('@')) return undefined;
  if (/^\+?\d[\d\s()-]{5,}$/.test(identity)) return undefined;
  return subjectRef;
}

export function ActionRequiredTable() {
  const navigate = useNavigate();
  const query = useActionRequiredItems();
  const items = query.data?.items ?? [];
  const total = query.data?.unavailable ? 0 : paginationTotal(query.data?.pagination, items.length);
  const columns: DataTableColumn<ActionRequiredItem>[] = [
    {
      id: 'item',
      header: 'Item',
      size: 'xl',
      kind: 'identity',
      sticky: 'identity',
      cell: (item) => {
        const label = item.status ?? item.category ?? 'Unknown';
        return <span className="status"><span className={`dot ${statusDot(item.status)}`}></span>{label}</span>;
      },
    },
    {
      id: 'resource',
      header: 'Resource',
      size: 'flex',
      cell: (item) => (
        <span className="resource">
          <span className="mono">{item.id ?? '—'}</span>
          {safeSubjectRef(item.subjectRef) && <span>{safeSubjectRef(item.subjectRef)}</span>}
        </span>
      ),
    },
    {
      id: 'since',
      header: 'Since',
      size: 'md',
      kind: 'date',
      cell: (item) => <span className="ts" title={item.updatedAt}>{relativeTime(item.updatedAt) || '—'}</span>,
    },
    {
      id: 'action',
      header: <span className="visually-hidden">Action</span>,
      size: 'xs',
      kind: 'action',
      align: 'end',
      cell: (item) => {
        const action = itemAction(item);
        return action ? <Link className="btn" to={action.to} onClick={(event) => event.stopPropagation()}>{action.label}</Link> : '—';
      },
    },
  ];
  const tableState: DataTableState<ActionRequiredItem> = query.data?.unavailable
    ? { status: 'unavailable', message: 'No activity yet. Action items appear once the platform records events.' }
    : query.isError
      ? { status: 'error', error: query.error, onRetry: query.refetch }
      : query.isLoading
        ? { status: 'loading', skeletonRows: 4 }
        : items.length === 0
          ? { status: 'empty', message: 'Nothing needs attention.' }
          : { status: 'ready', rows: items };

  return (
    <DataTableWorkspace className="section overview-actions" aria-labelledby="overview-actions-title">
      <div className="overview-section-head">
        <h2 id="overview-actions-title">
          Action required <span className="muted num">· {total}</span>
        </h2>
      </div>
      <DataTable
        caption="Action required work queue"
        layout="compact"
        appearance="subtle"
        columns={columns}
        state={tableState}
        getRowKey={(item, index) => item.id ?? `${item.status ?? item.category ?? 'unknown'}-${index}`}
        getRowProps={(item) => {
          const action = itemAction(item);
          return action ? {
            className: 'responsive-table-actionable',
            tabIndex: 0,
            onClick: () => navigate(action.to),
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigate(action.to);
              }
            },
          } : {};
        }}
        renderMobileSummary={(item) => {
          const action = itemAction(item);
          const label = item.status ?? item.category ?? 'Unknown';
          const subject = safeSubjectRef(item.subjectRef);
          return (
            <MobileRowSummary
              identity={subject ?? item.id ?? 'Unknown item'}
              identifier={subject && item.id ? item.id : undefined}
              secondary={<span className="status"><span className={`dot ${statusDot(item.status)}`}></span>{label}</span>}
              meta={relativeTime(item.updatedAt) || undefined}
              actionLabel={action ? `${action.label} ${subject ?? item.id ?? 'item'}` : undefined}
            />
          );
        }}
        footer={(
          <DataTableFooter
            primary={<span className="num">{tableState.status === 'ready' || tableState.status === 'empty' ? `${items.length} of ${total} items` : 'Results —'}</span>}
          />
        )}
      />
    </DataTableWorkspace>
  );
}
