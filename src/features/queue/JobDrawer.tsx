import { useEffect } from 'react';
import type { JobResource } from '@/api/queue';
import { relativeTime } from '@/lib/format';

export function jobStatusDot(status: string | undefined) {
  switch (status?.toLowerCase()) {
    case 'completed': return 'dot-ok';
    case 'failed':
    case 'dead':
    case 'dead-lettered': return 'dot-failed';
    case 'retrying': return 'dot-degraded';
    case 'queued':
    case 'reserved': return 'dot-pending';
    case 'running': return 'dot-info';
    default: return 'dot-info';
  }
}

function TimeFact({ value }: { value: string | undefined }) {
  return <span className="ts" title={value}>{relativeTime(value) || '—'}</span>;
}

export function JobDrawer({ job, requestedJobId, onClose }: { job: JobResource; requestedJobId: string; onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <aside className="drawer queue-drawer" aria-labelledby="job-detail-title">
      <header className="drawer-head">
        <div className="drawer-identity">
          <span className="eyebrow">Job detail</span>
          <div className="drawer-title-row">
            <h2 id="job-detail-title">{job.workType ?? 'Job details'}</h2>
            <span className="status terminal-status"><span className={`dot ${jobStatusDot(job.status)}`}></span>{job.status ?? '—'}</span>
          </div>
          <span className="mono">{requestedJobId}</span>
        </div>
        <button className="close" type="button" aria-label="Close job details" title="Close" onClick={onClose}>✕</button>
      </header>

      <div className="drawer-scroll">
        <section aria-labelledby="job-facts-title">
          <h3 id="job-facts-title">Facts</h3>
          <dl className="kv">
            <dt>ID</dt><dd><span className="mono">{job.id}</span></dd>
            <dt>Status</dt><dd><span className="status"><span className={`dot ${jobStatusDot(job.status)}`}></span>{job.status ?? '—'}</span></dd>
            <dt>Type</dt><dd>{job.workType ?? '—'}</dd>
            <dt>Owner</dt><dd>{job.ownerContext ?? '—'}</dd>
            <dt>Resource</dt><dd><span className="mono">{job.resourceRef ?? '—'}</span></dd>
            <dt>Attempts</dt><dd className="num">{job.attemptCount ?? '—'}</dd>
            <dt>Failure</dt><dd>{job.failureCategory ?? '—'}</dd>
            <dt>Reason</dt><dd>{job.reasonCode ?? '—'}</dd>
            <dt>Created</dt><dd><TimeFact value={job.createdAt} /></dd>
            <dt>Updated</dt><dd><TimeFact value={job.updatedAt} /></dd>
            <dt>Next run</dt><dd><TimeFact value={job.nextRunAt} /></dd>
          </dl>
        </section>
      </div>
    </aside>
  );
}
