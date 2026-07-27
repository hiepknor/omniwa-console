import { useState } from 'react';
import { CampaignsView } from '@/features/campaigns/CampaignsView';
import { CampaignProgressSummary, campaignTargetLabel } from '@/features/campaigns/CampaignProgress';
import { Button, DescriptionItem, DescriptionList, Drawer, Status, Tabs } from '@/ui';
import { campaignDetailFixture, campaignsFixture } from './preview-fixtures';

/** Dev-only: Campaigns directory + an open campaign inspector (overview tab). */
export function PreviewCampaigns() {
  const [open, setOpen] = useState(true);
  const d = campaignDetailFixture;
  return (
    <main className="min-h-dvh bg-bg">
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
          <CampaignProgressSummary campaign={d.campaign} />
          <DescriptionList>
            {[['Status', 'Running'], ['Recipients', '1284'], ['Target', campaignTargetLabel(d.campaign)], ['Content', 'text'], ['Starts', '1h ago'], ['Version', '4']].map(([k, v]) => (
              <DescriptionItem key={k} label={k}>{v}</DescriptionItem>
            ))}
          </DescriptionList>
          <div className="grid gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-fg-3">Message content</span>
            <p className="p-3 text-[13px] text-fg bg-recessed border border-line whitespace-pre-wrap">{d.campaign.text}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Pause</Button>
            <Button variant="danger">Abort</Button>
          </div>
        </div>
      </Drawer>
    </main>
  );
}
