import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiFailure } from '@/api/envelopes';
import type { CampaignStatus } from '@/api/campaigns';
import { humanizeToken, relativeTime } from '@/lib/format';
import { useInvalidCursorReset } from '@/lib/useInvalidCursorReset';
import { Button, CursorPagination, DateTimeInput, DescriptionItem, DescriptionList, Dialog, Drawer, Field, StateNotice, Status, Table, Tabs, Td, Th, Tr } from '@/ui';
import { useCampaignAudit, useCampaignRecipients, useCampaignTransition, useCampaign } from './hooks';
import { campaignRouteState, setCampaignParam, type CampaignTab } from './route-state';
import { campaignTone } from './CampaignsView';

const allowedActions: Record<CampaignStatus, Array<'schedule' | 'start' | 'pause' | 'resume' | 'abort'>> = {
  draft: ['schedule', 'start', 'abort'], scheduled: ['start', 'abort'], running: ['pause', 'abort'], paused: ['resume', 'abort'], completed: [], aborted: [], failed: [],
};

function Fail({ error, command, stale, onRetry }: { error: unknown; command?: boolean; stale?: boolean; onRetry?: () => void }) {
  const f = error instanceof ApiFailure ? error : undefined;
  return <StateNotice kind="error" title={command ? 'Command failed' : stale ? 'Showing last known data' : 'Read failed'} detail={f?.message ?? 'An unexpected error occurred.'} requestId={f?.requestId} action={onRetry ? <Button onClick={onRetry}>Retry</Button> : undefined} />;
}
function Fact({ label, value }: { label: string; value: string }) {
  return <DescriptionItem label={label}>{value}</DescriptionItem>;
}

export function CampaignInspector({ campaignId, commandsEnabled = true, onClose }: { campaignId: string; commandsEnabled?: boolean; onClose: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const route = campaignRouteState(searchParams);
  const detail = useCampaign(campaignId, commandsEnabled);
  const recipients = useCampaignRecipients(campaignId, route.recipientCursor, commandsEnabled && route.tab === 'recipients');
  const audit = useCampaignAudit(campaignId, route.auditCursor, commandsEnabled && route.tab === 'audit');
  const transition = useCampaignTransition(campaignId);
  const [command, setCommand] = useState<'schedule' | 'start' | 'pause' | 'resume' | 'abort'>();
  const [startsAt, setStartsAt] = useState('');
  const [ack, setAck] = useState<string>();
  const campaign = detail.data?.campaign;
  const setParam = (key: string, value?: string) => setSearchParams(setCampaignParam(searchParams, key, value), { replace: true });
  useInvalidCursorReset(recipients.error, route.recipientCursor, () => setParam('recipientCursor'));
  useInvalidCursorReset(audit.error, route.auditCursor, () => setParam('auditCursor'));
  const selectTab = (tab: CampaignTab) => setParam('tab', tab === 'overview' ? undefined : tab);
  const submitCommand = async () => {
    if (!command) return;
    let iso: string | undefined;
    if (command === 'schedule') {
      const ts = Date.parse(startsAt);
      if (Number.isNaN(ts)) return;
      iso = new Date(ts).toISOString();
    }
    try { await transition.mutateAsync({ action: command, startsAt: iso }); setAck(command); setCommand(undefined); } catch { /* stays visible */ }
  };

  return (
    <>
      <Drawer open onClose={onClose} title={campaign?.name ?? 'Campaign detail'} subtitle={campaignId}>
        {!commandsEnabled && !detail.data ? (
          <StateNotice kind="empty" title="Campaign detail unavailable" detail="Capability discovery no longer advertises campaign_orchestration and no cached detail is available." />
        ) : detail.isPending ? (
          <StateNotice kind="loading" title="Loading campaign" />
        ) : detail.error || !detail.data || !campaign ? (
          <Fail error={detail.error ?? new Error('Campaign detail unavailable.')} onRetry={() => detail.refetch()} />
        ) : (
          <div className="grid gap-4">
            <Status tone={campaignTone(campaign.status)}>{humanizeToken(campaign.status)}</Status>
            {ack ? <StateNotice kind="info" title={`${humanizeToken(ack)} accepted`} detail="Refreshed campaign, recipient, and audit reads remain authoritative; this does not prove recipient delivery or completion." /> : null}
            {transition.error ? <Fail error={transition.error} command /> : null}
            {!commandsEnabled ? <StateNotice kind="empty" title="Commands unavailable" detail="The last usable campaign snapshot remains visible, but capability discovery no longer advertises campaign_orchestration." /> : null}

            <Tabs
              active={route.tab}
              onChange={(id) => selectTab(id as CampaignTab)}
              tabs={[{ id: 'overview', label: 'Overview' }, { id: 'recipients', label: 'Recipients', count: detail.data.recipientCount }, { id: 'audit', label: 'Audit' }]}
            />

            {route.tab === 'overview' ? (
              <div className="grid gap-4">
                <DescriptionList>
                  <Fact label="Status" value={humanizeToken(campaign.status)} />
                  <Fact label="Recipients" value={String(detail.data.recipientCount)} />
                  <Fact label="Content" value={campaign.contentType} />
                  <Fact label="Starts" value={relativeTime(campaign.startsAt) || 'Not scheduled'} />
                  <Fact label="Finished" value={relativeTime(campaign.finishedAt) || 'Not finished'} />
                  <Fact label="Version" value={String(campaign.version)} />
                </DescriptionList>
                <div className="grid gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-fg-3">Message content</span>
                  <p className="p-3 text-[13px] text-fg bg-recessed border border-line whitespace-pre-wrap">{campaign.text || 'No text reported.'}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-line">
                  {Object.entries(detail.data.byStatus).map(([status, count]) => (
                    <div key={status} className="grid gap-1 p-3 border-r border-b border-line">
                      <span className="text-[11px] uppercase tracking-wide text-fg-3">{humanizeToken(status)}</span>
                      <strong className="font-mono text-lg font-semibold tabular-nums">{String(count)}</strong>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(commandsEnabled ? allowedActions[campaign.status] : []).map((action) => (
                    <Button key={action} variant={action === 'abort' ? 'danger' : action === 'start' || action === 'resume' ? 'primary' : 'ghost'} disabled={transition.isPending} onClick={() => { transition.reset(); setCommand(action); }}>{humanizeToken(action)}</Button>
                  ))}
                </div>
              </div>
            ) : null}

            {route.tab === 'recipients' ? (
              !commandsEnabled && !recipients.data ? <StateNotice kind="empty" title="Recipients unavailable" detail="No cached recipient page is available while campaign_orchestration is absent." /> : recipients.isPending ? <StateNotice kind="loading" title="Loading recipients" /> : recipients.error && !recipients.data ? <Fail error={recipients.error} onRetry={() => recipients.refetch()} /> : recipients.data ? (
                <div className="grid gap-3">
                  <Table>
                    <thead><tr><Th>Recipient</Th><Th>Status</Th><Th className="text-right">Attempts</Th><Th>Updated</Th></tr></thead>
                    <tbody>
                      {recipients.data.items.map((item) => (
                        <Tr key={item.id}>
                          <Td><div className="grid gap-0.5"><span className="font-mono text-xs text-fg-2">{item.jid}</span><small className="text-xs text-fg-3">{item.optInSource || 'Source unreported'}</small></div></Td>
                          <Td><Status tone={campaignTone(item.status)}>{humanizeToken(item.status)}</Status></Td>
                          <Td className="text-right font-mono tabular-nums">{item.attemptCount}</Td>
                          <Td className="text-fg-2">{relativeTime(item.updatedAt) || 'Not reported'}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                  {!recipients.data.items.length ? <StateNotice kind="empty" title="No recipients" detail="No campaign recipients were returned." /> : null}
                  <CursorPagination cursor={route.recipientCursor} nextCursor={recipients.data.nextCursor ?? undefined} onCursor={(v) => setParam('recipientCursor', v)} />
                </div>
              ) : null
            ) : null}

            {route.tab === 'audit' ? (
              !commandsEnabled && !audit.data ? <StateNotice kind="empty" title="Audit unavailable" detail="No cached audit page is available while campaign_orchestration is absent." /> : audit.isPending ? <StateNotice kind="loading" title="Loading audit" /> : audit.error && !audit.data ? <Fail error={audit.error} onRetry={() => audit.refetch()} /> : audit.data ? (
                <div className="grid gap-3">
                  <ol className="grid">
                    {audit.data.items.map((item) => (
                      <li key={item.id} className="grid gap-1 py-2 border-b border-line last:border-b-0">
                        <div className="flex items-center justify-between gap-3">
                          <Status tone="neutral">{humanizeToken(item.eventType || 'event')}</Status>
                          <span className="text-xs text-fg-3">{relativeTime(item.occurredAt) || 'Time unreported'}</span>
                        </div>
                        <strong className="text-[13px] font-medium text-fg">{item.fromStatus && item.toStatus ? `${humanizeToken(item.fromStatus)} → ${humanizeToken(item.toStatus)}` : humanizeToken(item.actorType || 'system')}</strong>
                      </li>
                    ))}
                  </ol>
                  {!audit.data.items.length ? <StateNotice kind="empty" title="No audit entries" detail="No campaign audit entries were returned." /> : null}
                  <CursorPagination cursor={route.auditCursor} nextCursor={audit.data.nextCursor ?? undefined} onCursor={(v) => setParam('auditCursor', v)} />
                </div>
              ) : null
            ) : null}
          </div>
        )}
      </Drawer>

      <Dialog
        open={Boolean(command)}
        onClose={() => setCommand(undefined)}
        closeDisabled={transition.isPending}
        title={command ? `${humanizeToken(command)} campaign` : ''}
        footer={<><Button disabled={transition.isPending} onClick={() => setCommand(undefined)}>Cancel</Button><Button variant={command === 'abort' ? 'danger' : 'primary'} disabled={transition.isPending || (command === 'schedule' && Number.isNaN(Date.parse(startsAt)))} onClick={() => void submitCommand()}>{transition.isPending ? 'Submitting…' : `Confirm ${command}`}</Button></>}
      >
        <div className="grid gap-3">
          <p className="text-sm text-fg-2">{command === 'abort' ? 'Abort is terminal. Pending recipients become aborted and the campaign cannot restart.' : command === 'pause' ? 'An already-leased recipient may finish; only new worker claims stop.' : 'The server validates the lifecycle transition and remains authoritative.'}</p>
          {command === 'schedule' ? (
            <Field label="Start time" required>{(id) => <DateTimeInput id={id} required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />}</Field>
          ) : null}
          {transition.error ? <Fail error={transition.error} command /> : null}
          <p className="text-xs text-fg-3">No one-click retry is offered after an uncertain command result. Refresh authoritative campaign and audit state before deciding to submit again.</p>
        </div>
      </Dialog>
    </>
  );
}
