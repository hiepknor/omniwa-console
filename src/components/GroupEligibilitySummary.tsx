import type { GroupEligibilityAggregate } from '@/api/group-lists';
import { humanizeToken, relativeTime } from '@/lib/format';
import { ProgressBar, Status } from '@/ui';

export function GroupEligibilitySummary({ value }: { value: GroupEligibilityAggregate }) {
  const blocked = value.unavailable + value.unknown;
  return (
    <div className="grid gap-3 border border-line bg-elevated p-3" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-sm">Target eligibility</strong>
        <Status tone={value.readyToTarget ? 'ok' : value.unknown ? 'degraded' : 'failed'}>
          {value.readyToTarget ? 'Ready to target' : `${blocked} blocked`}
        </Status>
      </div>
      <ProgressBar label="Groups currently eligible" value={value.eligible} max={value.total || 1} status={value.readyToTarget ? 'complete' : 'active'} />
      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs tabular-nums text-fg-2">
        <span>{value.eligible} eligible</span><span>{value.unavailable} unavailable</span><span>{value.unknown} unknown</span>
      </div>
      {Object.keys(value.byReason).length ? <ul className="grid gap-1 border-t border-line pt-2 text-xs text-fg-2">{Object.entries(value.byReason).sort(([left], [right]) => left.localeCompare(right)).map(([reason, count]) => <li key={reason} className="flex justify-between gap-3"><span>{humanizeToken(reason)}</span><span className="font-mono tabular-nums">{count}</span></li>)}</ul> : null}
      <p className="text-xs text-fg-3">Checked {relativeTime(value.checkedAt) || 'time not reported'}. The backend validates again when the command is submitted.</p>
    </div>
  );
}
