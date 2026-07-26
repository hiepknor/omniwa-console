import type { ReactNode } from 'react';
import type { Campaign, CampaignStatus } from '@/api/campaigns';
import { humanizeToken, relativeTime } from '@/lib/format';
import { Button, ButtonLink, CursorPagination, Field, PageHeader, Panel, Select, StateNotice, Status, Table, Td, Th, Tr, type Tone } from '@/ui';

const statuses: CampaignStatus[] = ['draft', 'scheduled', 'running', 'paused', 'completed', 'aborted', 'failed'];

export function campaignTone(status: string): Tone {
  if (status === 'running' || status === 'completed' || status === 'delivered' || status === 'read') return 'ok';
  if (status === 'failed' || status === 'aborted') return 'failed';
  if (status === 'scheduled' || status === 'processing') return 'pending';
  if (status === 'paused' || status === 'skipped') return 'degraded';
  return 'neutral';
}

export type CampaignsViewProps = {
  refreshing: boolean;
  onRefresh: () => void;
  newHref?: string;
  notices?: ReactNode;
  status: string;
  onStatus: (v?: string) => void;
  count: number;
  initialLoading: boolean;
  empty: boolean;
  emptyDetail?: string;
  errorSlot?: ReactNode;
  items: Campaign[];
  selectedId?: string;
  onOpen: (id: string) => void;
  cursor?: string;
  nextCursor?: string;
  onCursor: (v?: string) => void;
};

export function CampaignsView(props: CampaignsViewProps) {
  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader
        eyebrow="Messaging"
        title="Campaigns"
        description="Server-owned campaign orchestration with explicit consent, factual recipient outcomes, and durable audit history."
        actions={
          <>
            <Button onClick={props.onRefresh} disabled={props.refreshing} aria-busy={props.refreshing || undefined}>{props.refreshing ? 'Refreshing…' : 'Refresh'}</Button>
            {props.newHref ? <ButtonLink to={props.newHref} variant="primary">New campaign</ButtonLink> : null}
          </>
        }
      />

      {props.notices}

      <Panel title="Campaign directory" description="Status filter, opaque cursor, and selected campaign remain URL-addressable." bodyClassName="p-0">
        <div className="flex items-end justify-between gap-3 p-4 border-b border-line max-sm:flex-col max-sm:items-stretch">
          <Field label="Status" className="w-full max-w-56">
            {(id, labelId) => (
              <Select id={id} aria-labelledby={labelId} value={props.status} onValueChange={(value) => props.onStatus(value || undefined)}>
                <option value="">All statuses</option>
                {statuses.map((s) => <option key={s} value={s}>{humanizeToken(s)}</option>)}
              </Select>
            )}
          </Field>
          <span className="text-xs text-fg-3">{props.count} campaigns on this page</span>
        </div>

        {props.errorSlot ? <div className="p-4">{props.errorSlot}</div> : null}
        {props.initialLoading ? <div className="p-4"><StateNotice kind="loading" title="Loading campaigns" /></div> : null}

        {props.items.length > 0 ? (
          <Table className="border-0">
            <thead>
              <tr><Th>Campaign</Th><Th>Status</Th><Th>Starts</Th><Th>Updated</Th><Th className="text-right">Version</Th></tr>
            </thead>
            <tbody>
              {props.items.map((c) => (
                <Tr key={c.id} selected={c.id === props.selectedId} onClick={() => props.onOpen(c.id)}>
                  <Td>
                    <div className="grid gap-0.5"><span className="font-medium">{c.name}</span><small className="font-mono text-xs text-fg-3">{c.id}</small></div>
                  </Td>
                  <Td><Status tone={campaignTone(c.status)}>{humanizeToken(c.status)}</Status></Td>
                  <Td className="text-fg-2">{relativeTime(c.startsAt) || 'Not scheduled'}</Td>
                  <Td className="text-fg-2">{relativeTime(c.updatedAt) || 'Not reported'}</Td>
                  <Td className="text-right font-mono tabular-nums">{c.version}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : props.empty ? (
          <div className="p-4"><StateNotice kind="empty" title="No campaigns" detail={props.emptyDetail ?? 'No campaigns exist in this instance scope.'} /></div>
        ) : null}

        <CursorPagination cursor={props.cursor} nextCursor={props.nextCursor} onCursor={props.onCursor} />
      </Panel>
    </div>
  );
}
