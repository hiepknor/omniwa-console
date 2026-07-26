import { useState } from 'react';
import { CampaignsView } from '@/features/campaigns/CampaignsView';
import { Button, Drawer, Status, Tabs } from '@/ui';
import { campaignDetailFixture, campaignsFixture } from './preview-fixtures';

/** Dev-only: Campaigns directory + an open campaign inspector (overview tab). */
export function PreviewCampaigns() {
  const [open, setOpen] = useState(true);
  const d = campaignDetailFixture;
  return (
    <div className="min-h-dvh bg-bg">
      <CampaignsView
        refreshing={false}
        onRefresh={() => {}}
        newHref="#"
        status=""
        onStatus={() => {}}
        count={campaignsFixture.length}
        initialLoading={false}
        empty={false}
        items={campaignsFixture}
        selectedId={d.campaign.id}
        onOpen={() => setOpen(true)}
        cursor={undefined}
        nextCursor="cursor_next"
        onCursor={() => {}}
      />

      <Drawer open={open} onClose={() => setOpen(false)} title={d.campaign.name} subtitle={d.campaign.id}>
        <div className="grid gap-4">
          <Status tone="ok">Running</Status>
          <Tabs active="overview" onChange={() => {}} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'recipients', label: 'Recipients', count: d.recipientCount }, { id: 'audit', label: 'Audit' }]} />
          <dl>
            {[['Status', 'Running'], ['Recipients', '1284'], ['Content', 'text'], ['Starts', '1h ago'], ['Version', '4']].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 py-1.5 border-b border-line last:border-b-0"><dt className="text-xs text-fg-3">{k}</dt><dd className="text-[13px] text-fg">{v}</dd></div>
            ))}
          </dl>
          <div className="grid gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-fg-3">Message content</span>
            <p className="p-3 text-[13px] text-fg bg-recessed border border-line whitespace-pre-wrap">{d.campaign.text}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-line">
            {Object.entries(d.byStatus).map(([status, count]) => (
              <div key={status} className="grid gap-1 p-3 border-r border-b border-line">
                <span className="text-[11px] uppercase tracking-wide text-fg-3">{status}</span>
                <strong className="font-mono text-lg font-semibold tabular-nums">{count}</strong>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Pause</Button>
            <Button variant="danger">Abort</Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
