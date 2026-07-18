import { useState } from 'react';
import { Link } from 'react-router-dom';
import { InlineError } from '@/components/InlineError';
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

function safeSubjectRef(subjectRef: string | undefined): string | undefined {
  if (subjectRef === undefined) return undefined;
  const separatorIndex = subjectRef.indexOf(':');
  const identity = separatorIndex === -1 ? subjectRef : subjectRef.slice(separatorIndex + 1);
  if (identity.includes('@')) return undefined;
  if (/^\+?\d[\d\s()-]{5,}$/.test(identity)) return undefined;
  return subjectRef;
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

function NeutralActionState({ status, title, detail }: { status: string; title: string; detail: string }) {
  return (
    <section className="overview-actions" aria-labelledby="overview-actions-title">
      <div className="overview-section-label"><span>Action required</span><span>{status}</span></div>
      <div className="overview-neutral-state">
        <span className="overview-neutral-mark" aria-hidden="true"></span>
        <div>
          <h2 id="overview-actions-title">{title}</h2>
          <p>{detail}</p>
        </div>
      </div>
    </section>
  );
}

function ActionItem({ item }: { item: ActionRequiredItem }) {
  const action = itemAction(item);
  const subject = safeSubjectRef(item.subjectRef) ?? item.id ?? 'Unknown resource';
  const status = item.status ?? item.category ?? 'Unknown';
  const content = (
    <>
      <span className={`dot ${statusDot(item.status)}`} aria-hidden="true"></span>
      <span className="overview-action-identity">
        <strong>{subject}</strong>
        {item.id && subject !== item.id && <small className="mono">{item.id}</small>}
      </span>
      <span className="overview-action-status">{status}</span>
      <span className="ts">{relativeTime(item.updatedAt) || 'Age unavailable'}</span>
      {action && <span className="overview-action-disclosure" aria-hidden="true">›</span>}
    </>
  );

  return action ? (
    <Link className="overview-action-item" to={action.to} aria-label={`${action.label} ${subject}`}>{content}</Link>
  ) : (
    <div className="overview-action-item">{content}</div>
  );
}

export function ActionRequiredList() {
  const query = useActionRequiredItems();
  const [showAll, setShowAll] = useState(false);
  const items = query.data?.items ?? [];
  const hasKnownTotal = !query.data?.unavailable && !query.isLoading;
  const total = hasKnownTotal ? paginationTotal(query.data?.pagination, items.length) : undefined;

  if (query.data?.unavailable) {
    return (
      <NeutralActionState
        status="Data pending"
        title="Action-required items are not available yet."
        detail="This read is pending. No failure has been reported, and unavailable data is not treated as an empty queue."
      />
    );
  }
  if (query.isLoading) {
    return <NeutralActionState status="Checking" title="Checking action-required items." detail="The first action read is still in progress." />;
  }
  if (query.isError && items.length === 0) {
    return (
      <section className="overview-actions" aria-labelledby="overview-actions-title">
        <div className="overview-section-label"><h2 id="overview-actions-title">Action required</h2><span>Read failed</span></div>
        <InlineError error={query.error} onRetry={() => { void query.refetch(); }} className="overview-action-error" />
      </section>
    );
  }
  if (items.length === 0) {
    return <NeutralActionState status="0 reported" title="Nothing needs attention." detail="The action read completed with no action-required items." />;
  }

  const visibleItems = showAll ? items : items.slice(0, 5);
  const hasMore = items.length > 5;

  return (
    <section className="overview-actions overview-action-list" aria-labelledby="overview-actions-title">
      <div className="overview-section-label">
        <h2 id="overview-actions-title">Action required</h2>
        <span className="num">{query.isError ? 'Stale' : `${total ?? items.length} reported`}</span>
      </div>
      <div className="overview-action-items">
        {visibleItems.map((item, index) => <ActionItem item={item} key={item.id ?? `${item.status ?? item.category ?? 'unknown'}-${index}`} />)}
      </div>
      {query.isError && <InlineError error={query.error} onRetry={() => { void query.refetch(); }} className="overview-action-error" />}
      <div className="overview-action-footer">
        <span>Showing {visibleItems.length} of {total ?? items.length}</span>
        {hasMore && (
          <button className="btn sm" type="button" aria-expanded={showAll} onClick={() => setShowAll((current) => !current)}>
            {showAll ? 'Show less' : 'Show all'}
          </button>
        )}
      </div>
    </section>
  );
}
