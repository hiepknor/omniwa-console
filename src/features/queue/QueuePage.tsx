import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { opsKeys } from '@/api/keys';
import { StatusIndicator } from '@/components/badges';
import { InlineError } from '@/components/InlineError';
import { MobileFilterSheet } from '@/components/MobileFilterSheet';
import { PageHeader } from '@/components/PageHeader';
import { PollingIndicator } from '@/components/RealtimeIndicator';
import {
  DataTable,
  DataTableActiveFilters,
  DataTableFilterTrigger,
  DataTableFooter,
  DataTableToolbar,
  DataTableWorkspace,
  type DataTableColumn,
  type DataTableState,
} from '@/components/data-table';
import { SelectDropdown, type SelectDropdownOption } from '@/components/SelectDropdown';
import { formatCount, relativeTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import { JobDrawer, JobDrawerState, jobStatusDot } from './JobDrawer';
import { useJob, useJobs, useQueueStatus } from './hooks';

function MetricCard({ label, value, context, attention = false }: {
  label: string;
  value: number | undefined;
  context: string;
  attention?: boolean;
}) {
  const reported = value !== undefined;
  return (
    <article className={`card queue-metric-card${attention ? ' queue-metric-action' : ''}`}>
      <div className="label">{label}</div>
      <div className={`value${reported ? ' num' : ' queue-value-unavailable'}`}>{reported ? formatCount(value) : 'Not reported'}</div>
      <div className={`ctx${attention ? ' bad' : ''}`}>{reported ? context : 'Value unavailable'}</div>
    </article>
  );
}

export function QueuePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [filterOpen, setFilterOpen] = useState(false);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const jobId = searchParams.get('job') || undefined;
  const initialCursor = searchParams.get('cursor') ?? undefined;
  const queue = useQueueStatus();
  const list = useJobs(initialCursor);
  const detail = useJob(jobId);
  const pages = list.data?.pages ?? [];
  const listReadState = useResilientReadState(list, pages.some((page) => page.resource !== undefined));
  const unavailable = pages.some((page) => page.unavailable !== undefined);
  const jobs = useMemo(() => pages.flatMap((page) => page.resource?.items ?? []), [pages]);
  const filteredJobs = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesSearch = !needle
        || job.id.toLowerCase().includes(needle)
        || job.workType?.toLowerCase().includes(needle)
        || job.resourceRef?.toLowerCase().includes(needle);
      return matchesSearch && (!status || job.status === status);
    });
  }, [jobs, search, status]);
  const statuses = [...new Set(jobs.map((job) => job.status).filter((value): value is string => Boolean(value)))].sort();
  const latestUpdate = jobs.map((job) => job.updatedAt).filter((value): value is string => value !== undefined).sort().at(-1);
  const queueResource = queue.data?.resource;
  const inFlight = queueResource?.runningJobCount !== undefined && queueResource.reservedJobCount !== undefined
    ? queueResource.runningJobCount + queueResource.reservedJobCount
    : undefined;

  const setParam = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value); else next.delete(name);
    if (name === 'search' || name === 'status') next.delete('cursor');
    setSearchParams(next, { replace: true });
  };
  const closeJob = () => setParam('job', '');
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: opsKeys.queue });
    void queryClient.invalidateQueries({ queryKey: opsKeys.jobs });
  };
  const loadMore = async () => {
    const nextCursor = pages.at(-1)?.resource?.pagination?.nextCursor;
    if (!nextCursor) return;
    const result = await list.fetchNextPage();
    if (!result.isError) setParam('cursor', nextCursor);
  };

  type JobRow = (typeof jobs)[number];
  const columns: DataTableColumn<JobRow>[] = [
    { id: 'job', header: 'Job', size: 'lg', kind: 'identifier', sticky: 'identity', mobile: 'identity', cell: (job) => <span className="mono" title={job.id}>{job.id}</span> },
    { id: 'type', header: 'Type', size: 'xl', mobile: 'identifier', cell: (job) => job.workType ?? '—' },
    { id: 'status', header: 'Status', size: 'md', kind: 'status', mobile: 'secondary', cell: (job) => <StatusIndicator dotClass={jobStatusDot(job.status)}>{job.status ?? '—'}</StatusIndicator> },
    { id: 'attempts', header: 'Attempts', size: 'sm', kind: 'numeric', align: 'end', mobile: 'hidden', cell: (job) => <span className="num">{job.attemptCount ?? '—'}</span> },
    { id: 'resource', header: 'Resource', size: 'lg', kind: 'identifier', mobile: 'hidden', cell: (job) => <span className="mono" title={job.resourceRef}>{job.resourceRef ?? '—'}</span> },
    { id: 'updated', header: 'Updated', size: 'md', kind: 'date', mobile: 'meta', cell: (job) => <span className="ts" title={job.updatedAt}>{relativeTime(job.updatedAt) || '—'}</span>, mobileCell: (job) => relativeTime(job.updatedAt) || undefined },
  ];
  const tableState: DataTableState<JobRow> = listReadState.isInitialError
    ? { status: 'error', error: listReadState.error, onRetry: list.refetch }
    : listReadState.isInitialLoading
      ? { status: 'loading', skeletonRows: 6 }
      : unavailable && jobs.length === 0
        ? { status: 'unavailable', message: 'Job data is not available yet.' }
        : filteredJobs.length === 0
          ? { status: 'empty', message: jobs.length === 0 ? 'No jobs yet.' : 'No jobs match these filters.' }
          : { status: 'ready', rows: filteredJobs };
  const statusOptions: SelectDropdownOption[] = [
    { value: '', label: 'All statuses', description: 'Do not filter the table' },
    ...statuses.map((item) => ({ value: item, label: item, meta: String(jobs.filter((job) => job.status === item).length) })),
  ];
  const activeFilters = status ? [{ id: 'status', label: `Status: ${status}`, onRemove: () => setParam('status', '') }] : [];

  return (
    <>
      <PageHeader title="Queue & Jobs" status={<PollingIndicator />} />

      <section className="queue-metric-section" aria-labelledby="queue-posture-title">
        <div className="queue-metric-head">
          <h2 id="queue-posture-title">Queue posture</h2>
          {queueResource?.status && <StatusIndicator className="queue-status-chip" dotClass={jobStatusDot(queueResource.status)}>{queueResource.status}</StatusIndicator>}
        </div>
        <div className="metrics queue-metrics">
          <MetricCard label="Queue depth" value={queueResource?.queuedJobCount} context="Queued jobs" />
          <MetricCard label="In flight" value={inFlight} context="Running and reserved" />
          <MetricCard label="Retrying" value={queueResource?.retryingJobCount} context="Scheduled to retry" />
          <MetricCard label="Dead-lettered" value={queueResource?.deadJobCount} context={queueResource?.deadJobCount !== undefined && queueResource.deadJobCount > 0 ? 'Action required' : 'No action required'} attention={queueResource?.deadJobCount !== undefined && queueResource.deadJobCount > 0} />
        </div>
        {queue.isError && <InlineError error={queue.error} onRetry={queue.refetch} className="queue-metric-error" />}
        {queue.data?.unavailable && <div className="empty queue-metric-pending">Queue posture is not available yet.</div>}
      </section>

      <DataTableWorkspace className="queue-workbench" aria-labelledby="jobs-table-title">
        <div className="queue-section-head"><div><h2>Jobs</h2><span className="queue-posture-note">Loaded jobs · newest updates first</span></div>{list.isSuccess && !unavailable && <span className="queue-result-count num">{filteredJobs.length} visible</span>}</div>
        <DataTableToolbar>
          <label className="search-field">
            <span className="visually-hidden">Search jobs</span>
            <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input className="search" type="search" value={search} onChange={(event) => setParam('search', event.target.value)} placeholder="Search job, type, or resource" />
          </label>
          <span className="data-table-toolbar-desktop-filters"><SelectDropdown label="Status" value={status} options={statusOptions} onChange={(value) => setParam('status', value)} /></span>
          <DataTableFilterTrigger ref={filterTriggerRef} count={activeFilters.length} aria-expanded={filterOpen} onClick={() => setFilterOpen(true)} />
          <DataTableActiveFilters filters={activeFilters} />
        </DataTableToolbar>
        <DataTable
          caption="Queue jobs and their current status"
          captionId="jobs-table-title"
          layout="wide"
          attached
          columns={columns}
          state={tableState}
          refreshIssue={listReadState.isStaleError ? { error: listReadState.error, onRetry: list.refetch } : undefined}
          getRowKey={(job) => job.id}
          getRowState={(job) => ({ active: job.id === jobId })}
          getRowActionLabel={(job) => `Open job ${job.id}`}
          getRowProps={(job) => ({
            className: 'responsive-table-actionable',
            tabIndex: 0,
            onClick: () => setParam('job', job.id),
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setParam('job', job.id);
              }
            },
          })}
          footer={<DataTableFooter primary={tableState.status === 'ready' || tableState.status === 'empty' ? <><span className="num">{filteredJobs.length} loaded jobs</span><span className="freshness">Updated {relativeTime(latestUpdate) || '—'}</span></> : <span className="num">Results —</span>} actions={<div className="pagination"><button className="btn" type="button" onClick={refresh}>Refresh</button>{list.hasNextPage && <button className="btn" type="button" disabled={list.isFetchingNextPage} onClick={() => void loadMore()}>{list.isFetchingNextPage ? 'Loading…' : 'Load more'}</button>}</div>} />}
        />
      </DataTableWorkspace>

      <MobileFilterSheet open={filterOpen} title="Filter jobs" onClose={() => setFilterOpen(false)} returnFocusRef={filterTriggerRef}>
        <section className="mobile-filter-section" aria-labelledby="job-status-filter"><h3 id="job-status-filter">Status</h3><div className="mobile-filter-options">
          {statusOptions.map((option) => <button key={option.value} className={option.value === status ? 'is-selected' : undefined} type="button" aria-pressed={option.value === status} onClick={() => setParam('status', option.value)}><span className="filter-option-check" aria-hidden="true">✓</span><span>{option.label}</span>{option.meta && <span className="num">{option.meta}</span>}</button>)}
        </div></section>
        <button className="btn primary mobile-filter-done" type="button" onClick={() => setFilterOpen(false)}>Done</button>
      </MobileFilterSheet>

      {jobId && (detail.data?.resource
        ? <JobDrawer job={detail.data.resource} requestedJobId={jobId} onClose={closeJob} />
        : detail.data?.unavailable
          ? <JobDrawerState jobId={jobId} onClose={closeJob}>Job data is not available yet.</JobDrawerState>
          : detail.isError
            ? <JobDrawerState jobId={jobId} onClose={closeJob}><InlineError error={detail.error} onRetry={detail.refetch} /></JobDrawerState>
            : <JobDrawerState jobId={jobId} onClose={closeJob} announce>Loading job details…</JobDrawerState>)}
    </>
  );
}
