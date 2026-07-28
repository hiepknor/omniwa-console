import type { Campaign } from '@/api/campaigns';
import { formatCount, humanizeToken, relativeTime } from '@/lib/format';
import { ProgressBar, StateNotice, Status, type Tone } from '@/ui';

const outcomeKeys = ['pending', 'processing', 'sent', 'delivered', 'read', 'failed', 'skipped', 'aborted'] as const;

function statusTone(status: string): Tone {
  if (status === 'running' || status === 'completed') return 'ok';
  if (status === 'failed' || status === 'aborted') return 'failed';
  if (status === 'scheduled') return 'pending';
  if (status === 'paused') return 'degraded';
  return 'neutral';
}

export function campaignTargetLabel(campaign: Campaign): string {
  if (campaign.target.type === 'direct') return `${formatCount(campaign.target.targetCount)} direct recipients`;
  if (campaign.target.type === 'unknown') return campaign.target.targetCount ? `${formatCount(campaign.target.targetCount)} targets` : 'Target unreported';
  const name = campaign.target.groupListName?.trim() || 'Group List';
  const version = campaign.target.groupListVersion ? ` · v${campaign.target.groupListVersion}` : '';
  return `${name}${version}`;
}

function retryTime(value: string | undefined): { label: string; future: boolean } | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return { label: date.toLocaleString(), future: date.getTime() > Date.now() };
}

export function CampaignProgressSummary({ campaign, compact = false }: { campaign: Campaign; compact?: boolean }) {
  const progress = campaign.progress;
  if (progress.total === 0) {
    return <span className="text-xs text-fg-3">No targets reported</span>;
  }

  if (compact) {
    return (
      <div className="grid min-w-40 gap-1.5">
        <ProgressBar label={`${formatCount(progress.processed)} / ${formatCount(progress.total)} processed`} value={progress.processed} max={progress.total} showValue={false} />
        <span className="text-[11px] text-fg-3">
          {formatCount(progress.processing)} active · {formatCount(progress.failed)} failed · {formatCount(progress.skipped)} skipped
        </span>
      </div>
    );
  }

  return (
    <div className="grid gap-3 border border-line bg-elevated p-3">
      <ProgressBar
        label={`${formatCount(progress.processed)} of ${formatCount(progress.total)} targets processed`}
        value={progress.processed}
        max={progress.total}
        status={campaign.status === 'failed' ? 'failed' : 'active'}
      />
      <div className="grid grid-cols-2 border-l border-t border-line sm:grid-cols-4">
        {outcomeKeys.map((key) => (
          <div key={key} className="grid gap-0.5 border-b border-r border-line p-2">
            <span className="text-[10px] uppercase tracking-wide text-fg-3">{humanizeToken(key)}</span>
            <strong className="font-mono text-sm font-semibold tabular-nums">{formatCount(progress[key])}</strong>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-fg-3">
        <span>{campaignTargetLabel(campaign)}</span>
        <span>Updated {relativeTime(progress.updatedAt) || 'time unreported'}</span>
      </div>
    </div>
  );
}

export function CampaignOperationalState({ campaign }: { campaign: Campaign }) {
  const retry = retryTime(campaign.retryAt);
  return (
    <div className="grid gap-2" aria-live="polite">
      {campaign.needsAttention ? (
        <StateNotice
          kind="error"
          title="Operator attention required"
          detail={humanizeToken(campaign.statusReason ?? campaign.pauseReason ?? 'Review campaign audit before continuing.')}
        />
      ) : null}
      {!campaign.needsAttention && campaign.pauseReason ? (
        <StateNotice kind="info" title="Campaign paused" detail={humanizeToken(campaign.pauseReason)} />
      ) : null}
      {campaign.statusReason && !campaign.needsAttention ? (
        <div className="flex flex-wrap items-center gap-2 border border-line bg-elevated p-3 text-sm">
          <Status tone={statusTone(campaign.status)}>{humanizeToken(campaign.status)}</Status>
          <span className="text-fg-2">{humanizeToken(campaign.statusReason)}</span>
        </div>
      ) : null}
      {retry ? (
        <StateNotice
          kind="info"
          title={retry.future ? 'Backend retry window' : 'Retry window elapsed'}
          detail={retry.future
            ? `No new attempt is expected before ${retry.label}. Refresh remains safe; the Console does not trigger retries.`
            : `The reported retry window ended at ${retry.label}. Refresh campaign state before taking action.`}
        />
      ) : null}
    </div>
  );
}
