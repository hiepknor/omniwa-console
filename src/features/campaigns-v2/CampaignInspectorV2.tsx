import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CampaignStatus } from '@/api/campaigns';
import { ApiFailureNotice, Button, Dialog, Fact, Inspector, StateNotice, Status, Tabs } from '@/components/v2';
import { humanizeToken, relativeTime } from '@/lib/format';
import { useCampaignAuditV2, useCampaignRecipientsV2, useCampaignTransitionV2, useCampaignV2 } from './hooks';
import { campaignRouteState, setCampaignParam, type CampaignTabV2 } from './route-state';

function tone(status: string) {
  if (status === 'running' || status === 'completed' || status === 'delivered' || status === 'read') return 'healthy' as const;
  if (status === 'failed' || status === 'aborted') return 'failed' as const;
  if (status === 'scheduled' || status === 'processing') return 'pending' as const;
  if (status === 'paused' || status === 'skipped') return 'degraded' as const;
  return 'neutral' as const;
}

const allowedActions: Record<CampaignStatus, Array<'schedule' | 'start' | 'pause' | 'resume' | 'abort'>> = {
  draft: ['schedule', 'start', 'abort'], scheduled: ['start', 'abort'], running: ['pause', 'abort'], paused: ['resume', 'abort'], completed: [], aborted: [], failed: [],
};

export function CampaignInspectorV2({ campaignId, onClose }: { campaignId: string; onClose: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const route = campaignRouteState(searchParams);
  const detail = useCampaignV2(campaignId, true);
  const recipients = useCampaignRecipientsV2(campaignId, route.recipientCursor, route.tab === 'recipients');
  const audit = useCampaignAuditV2(campaignId, route.auditCursor, route.tab === 'audit');
  const transition = useCampaignTransitionV2(campaignId);
  const [command, setCommand] = useState<'schedule' | 'start' | 'pause' | 'resume' | 'abort'>();
  const [startsAt, setStartsAt] = useState('');
  const [ack, setAck] = useState<string>();
  const campaign = detail.data?.campaign;
  const setParam = (key: string, value?: string) => setSearchParams(setCampaignParam(searchParams, key, value), { replace: true });
  const selectTab = (tab: CampaignTabV2) => setParam('tab', tab === 'overview' ? undefined : tab);
  const submitCommand = async () => {
    if (!command) return;
    let iso: string | undefined;
    if (command === 'schedule') {
      const timestamp = Date.parse(startsAt);
      if (Number.isNaN(timestamp)) return;
      iso = new Date(timestamp).toISOString();
    }
    try {
      await transition.mutateAsync({ action: command, startsAt: iso });
      setAck(command);
      setCommand(undefined);
    } catch { /* Error remains visible in the confirmation dialog. */ }
  };

  return <>
    <Inspector titleId="campaign-v2-title" eyebrow="Campaign" title={campaign?.name ?? 'Campaign detail'} subtitle={<span className="ui-v2-mono">{campaignId}</span>} status={campaign ? <Status tone={tone(campaign.status)}>{humanizeToken(campaign.status)}</Status> : undefined} modal onClose={onClose}>
      {detail.isPending ? <StateNotice value={{ axis: 'resource', state: 'initial-loading' }} /> : detail.error || !detail.data || !campaign ? <ApiFailureNotice error={detail.error ?? new Error('Campaign detail unavailable.')} onRetry={() => detail.refetch()} /> : <div className="ui-v2-stack">
        {ack ? <StateNotice value={{ axis: 'command', state: 'acknowledged' }} detail={`${humanizeToken(ack)} was acknowledged by the server. Refreshed campaign, recipient, and audit reads remain authoritative; this does not prove recipient delivery or completion.`} /> : null}
        {transition.error ? <ApiFailureNotice error={transition.error} command /> : null}
        <Tabs label="Campaign detail" selectedId={route.tab} onSelect={(id) => selectTab(id as CampaignTabV2)} items={[{ id: 'overview', label: 'Overview' }, { id: 'recipients', label: 'Recipients', count: detail.data.recipientCount }, { id: 'audit', label: 'Audit' }]} />
        {route.tab === 'overview' ? <div id="overview-panel" role="tabpanel" aria-labelledby="overview-tab" className="ui-v2-stack">
          <dl className="ui-v2-detail-list"><Fact label="Status" value={humanizeToken(campaign.status)} /><Fact label="Recipients" value={String(detail.data.recipientCount)} /><Fact label="Content" value={campaign.contentType} /><Fact label="Starts" value={relativeTime(campaign.startsAt) || 'Not scheduled'} /><Fact label="Finished" value={relativeTime(campaign.finishedAt) || 'Not finished'} /><Fact label="Version" value={String(campaign.version)} /></dl>
          <div className="ui-v2-campaign-copy"><span>Message content</span><p>{campaign.text || 'No text reported.'}</p></div>
          <div className="ui-v2-campaign-breakdown">{Object.entries(detail.data.byStatus).map(([status, count]) => <div key={status}><span>{humanizeToken(status)}</span><strong>{count}</strong></div>)}</div>
          <div className="ui-v2-command-bar">{allowedActions[campaign.status].map((action) => <Button key={action} variant={action === 'abort' ? 'danger' : action === 'start' || action === 'resume' ? 'primary' : 'secondary'} disabled={transition.isPending} onClick={() => { transition.reset(); setCommand(action); }}>{humanizeToken(action)}</Button>)}</div>
        </div> : null}
        {route.tab === 'recipients' ? <div id="recipients-panel" role="tabpanel" aria-labelledby="recipients-tab"><PagedRead pending={recipients.isPending} error={recipients.error} retry={() => recipients.refetch()}>{recipients.data ? <><div className="ui-v2-table-wrap" tabIndex={0} aria-label="Campaign recipients"><table className="ui-v2-table ui-v2-campaign-recipient-table"><thead><tr><th>Recipient</th><th>Status</th><th>Attempts</th><th>Updated</th></tr></thead><tbody>{recipients.data.items.map((item) => <tr key={item.id}><td data-label="Recipient"><span className="ui-v2-mono">{item.jid}</span><small>{item.optInSource || 'Source unreported'}</small></td><td data-label="Status"><Status tone={tone(item.status)}>{humanizeToken(item.status)}</Status></td><td data-label="Attempts">{item.attemptCount}</td><td data-label="Updated">{relativeTime(item.updatedAt) || 'Not reported'}</td></tr>)}</tbody></table></div>{!recipients.data.items.length ? <StateNotice value={{ axis: 'resource', state: 'empty' }} detail="No campaign recipients were returned." /> : null}<CursorNav current={route.recipientCursor} next={recipients.data.nextCursor} onChange={(value) => setParam('recipientCursor', value)} /></> : null}</PagedRead></div> : null}
        {route.tab === 'audit' ? <div id="audit-panel" role="tabpanel" aria-labelledby="audit-tab"><PagedRead pending={audit.isPending} error={audit.error} retry={() => audit.refetch()}>{audit.data ? <><ol className="ui-v2-campaign-audit">{audit.data.items.map((item) => <li key={item.id}><Status tone="neutral">{humanizeToken(item.eventType || 'event')}</Status><strong>{item.fromStatus && item.toStatus ? `${humanizeToken(item.fromStatus)} → ${humanizeToken(item.toStatus)}` : humanizeToken(item.actorType || 'system')}</strong><span>{relativeTime(item.occurredAt) || 'Time unreported'}</span></li>)}</ol>{!audit.data.items.length ? <StateNotice value={{ axis: 'resource', state: 'empty' }} detail="No campaign audit entries were returned." /> : null}<CursorNav current={route.auditCursor} next={audit.data.nextCursor} onChange={(value) => setParam('auditCursor', value)} /></> : null}</PagedRead></div> : null}
      </div>}
    </Inspector>
    {command ? <Dialog titleId="campaign-command-title" eyebrow="Campaign lifecycle" title={`${humanizeToken(command)} campaign`} description={command === 'abort' ? 'Abort is terminal. Pending recipients become aborted and the campaign cannot restart.' : command === 'pause' ? 'An already-leased recipient may finish; only new worker claims stop.' : 'The server validates the lifecycle transition and remains authoritative.'} onClose={() => setCommand(undefined)} canClose={!transition.isPending} actions={<><Button disabled={transition.isPending} onClick={() => setCommand(undefined)}>Cancel</Button><Button variant={command === 'abort' ? 'danger' : 'primary'} disabled={transition.isPending || (command === 'schedule' && Number.isNaN(Date.parse(startsAt)))} onClick={() => void submitCommand()}>{transition.isPending ? 'Submitting…' : `Confirm ${command}`}</Button></>}>
      {command === 'schedule' ? <label className="ui-v2-field"><span className="ui-v2-field__label">Start time</span><input className="ui-v2-input" type="datetime-local" required value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label> : null}
      {transition.error ? <ApiFailureNotice error={transition.error} command /> : null}
      <p>No one-click retry is offered after an uncertain command result. Refresh authoritative campaign and audit state before deciding to submit again.</p>
    </Dialog> : null}
  </>;
}
function CursorNav({ current, next, onChange }: { current?: string; next: string | null; onChange: (value?: string) => void }) { return <div className="ui-v2-pagination"><span>{current ? 'Opaque cursor page' : 'First page'}</span><div>{current ? <Button onClick={() => onChange()}>Start over</Button> : null}<Button disabled={!next} onClick={() => onChange(next ?? undefined)}>Next page</Button></div></div>; }
function PagedRead({ pending, error, retry, children }: { pending: boolean; error: unknown; retry: () => unknown; children: React.ReactNode }) { if (pending) return <StateNotice value={{ axis: 'resource', state: 'initial-loading' }} />; if (error) return <ApiFailureNotice error={error} onRetry={retry} />; return children; }
