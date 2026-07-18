import { Link, useNavigate } from 'react-router-dom';
import { InlineError } from '@/components/InlineError';
import { MobileRowSummary, ResponsiveDataTable, type ResponsiveTableColumn } from '@/components/ResponsiveDataTable';
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
  const columns: ResponsiveTableColumn<ActionRequiredItem>[] = [
    {
      id: 'item',
      header: 'Item',
      className: 'responsive-table-sticky-identity',
      cell: (item) => {
        const label = item.status ?? item.category ?? 'Unknown';
        return <span className="status"><span className={`dot ${statusDot(item.status)}`}></span>{label}</span>;
      },
    },
    {
      id: 'resource',
      header: 'Resource',
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
      cell: (item) => <span className="ts" title={item.updatedAt}>{relativeTime(item.updatedAt) || '—'}</span>,
    },
    {
      id: 'action',
      header: <span className="visually-hidden">Action</span>,
      className: 'actioncol',
      cell: (item) => {
        const action = itemAction(item);
        return action ? <Link className="btn" to={action.to} onClick={(event) => event.stopPropagation()}>{action.label}</Link> : '—';
      },
    },
  ];

  return (
    <section className="section overview-actions" aria-labelledby="overview-actions-title">
      <div className="overview-section-head">
        <h2 id="overview-actions-title">
          Action required <span className="muted num">· {total}</span>
        </h2>
      </div>
      {query.data?.unavailable ? (
        <div
          className="tablewrap adaptive-table overview-action-table"
          tabIndex={0}
          role="region"
          aria-label="Action required work queue"
        >
          <div className="empty">No activity yet. Action items appear once the platform records events.</div>
        </div>
      ) : query.isError ? (
        <InlineError error={query.error} onRetry={query.refetch} />
      ) : (
        <div
          className="tablewrap adaptive-table overview-action-table"
          tabIndex={0}
          role="region"
          aria-label="Action required work queue"
        >
          {query.isLoading ? (
            <div className="empty">—</div>
          ) : items.length === 0 ? (
            <div className="empty">Nothing needs attention.</div>
          ) : (
            <>
              <ResponsiveDataTable
                caption="Action required work queue"
                columns={columns}
                rows={items}
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
                      meta={relativeTime(item.updatedAt) || '—'}
                      actionLabel={action ? `${action.label} ${subject ?? item.id ?? 'item'}` : undefined}
                    />
                  );
                }}
              />
              <div className="table-foot"><span className="num">{items.length} of {total} items</span></div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
