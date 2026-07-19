import type { JobResource } from '@/api/queue';
import { DetailDrawer, DetailDrawerState, DrawerIdentifier } from '@/components/drawer/DetailDrawer';
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
  return (
    <DetailDrawer titleId="job-detail-title" eyebrow="Job detail" title={job.workType ?? 'Job details'} status={<span className="status terminal-status"><span className={`dot ${jobStatusDot(job.status)}`}></span>{job.status ?? '—'}</span>} subtitle={<DrawerIdentifier value={requestedJobId} label="Copy job identifier" />} className="queue-drawer" closeLabel="Close job details" onClose={onClose}>
      <section aria-labelledby="job-facts-title">
        <h3 id="job-facts-title">Facts</h3>
        <dl className="kv">
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
    </DetailDrawer>
  );
}

export function JobDrawerState({ jobId, onClose, children, announce = false }: { jobId: string; onClose: () => void; children: React.ReactNode; announce?: boolean }) {
  return <DetailDrawer titleId="job-detail-title" eyebrow="Job detail" title="Job details" subtitle={<DrawerIdentifier value={jobId} label="Copy job identifier" />} className="queue-drawer" closeLabel="Close job details" onClose={onClose}><DetailDrawerState announce={announce}>{children}</DetailDrawerState></DetailDrawer>;
}
