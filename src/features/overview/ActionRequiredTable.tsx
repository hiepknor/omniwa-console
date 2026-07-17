import { Link } from 'react-router-dom';
import { relativeTime } from '@/lib/format';
import { InlineError } from './InlineError';
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
  if (!item.id) return null;
  const resourceType: string = item.resourceType;
  switch (resourceType.toLowerCase()) {
    case 'instance':
      return { to: `/instances/${item.id}`, label: 'Open' };
    case 'webhook':
      return { to: `/webhooks/${item.id}`, label: 'Review' };
    case 'job':
      return { to: `/queue?job=${encodeURIComponent(item.id)}`, label: 'Inspect' };
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
  if (subjectRef === undefined || subjectRef.includes('@')) return undefined;
  if (/^\+?\d[\d\s()-]{5,}$/.test(subjectRef)) return undefined;
  return subjectRef;
}

export function ActionRequiredTable() {
  const query = useActionRequiredItems();
  const items = query.data?.items ?? [];
  const total = paginationTotal(query.data?.pagination, items.length);

  return (
    <section className="section overview-actions" aria-labelledby="overview-actions-title">
      <div className="overview-section-head">
        <h2 id="overview-actions-title">
          Action required <span className="muted num">· {total}</span>
        </h2>
      </div>
      {query.isError ? (
        <InlineError error={query.error} onRetry={query.refetch} />
      ) : (
        <div
          className="tablewrap overview-action-table"
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
              <table>
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Resource</th>
                    <th scope="col">Since</th>
                    <th scope="col"><span className="visually-hidden">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const action = itemAction(item);
                    const label = item.status ?? item.category ?? 'Unknown';
                    return (
                      <tr key={item.id ?? `${label}-${index}`}>
                        <td>
                          <span className="status">
                            <span className={`dot ${statusDot(item.status)}`}></span>
                            {label}
                          </span>
                        </td>
                        <td>
                          <span className="resource">
                            <span className="mono">{item.id ?? '—'}</span>
                            {safeSubjectRef(item.subjectRef) && <span>{safeSubjectRef(item.subjectRef)}</span>}
                          </span>
                        </td>
                        <td className="ts" title={item.updatedAt}>{relativeTime(item.updatedAt) || '—'}</td>
                        <td className="actioncol">
                          {action ? <Link className="btn" to={action.to}>{action.label}</Link> : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="table-foot"><span className="num">{items.length} of {total} items</span></div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
