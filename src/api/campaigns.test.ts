import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { createCampaign, getCampaign, listCampaignRecipients, listCampaigns, transitionCampaign } from './campaigns';

function ok(data: unknown, status = 200) { return { data, response: new Response(null, { status }) }; }

describe('campaign orchestration adapter', () => {
  it('preserves instance-scoped campaign status and opaque pagination', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [{ id: 'campaign-1', name: 'Launch', status: 'running', textBody: 'Hello', version: 3, instanceId: 'must-not-pass', target: { type: 'group_list', groupListId: 'list-1', groupListName: 'Branches', groupListVersion: 4, targetCount: 12 }, progress: { total: 12, processed: 7, pending: 4, processing: 1, sent: 5, failed: 2, updatedAt: '2026-07-27T08:00:00Z' }, needsAttention: true, statusReason: 'unknown_send_outcome', pauseReason: 'operator_attention_required', retryAt: '2026-07-27T08:05:00Z' }], meta: { nextCursor: 'opaque/next' } }));
    const result = await listCampaigns({ GET } as unknown as ApiClient, { status: 'running', cursor: 'opaque/current', limit: 25 });
    expect(GET).toHaveBeenCalledWith('/campaigns', { params: { query: { status: 'running', cursor: 'opaque/current', limit: 25 } } });
    expect(result.nextCursor).toBe('opaque/next');
    expect(result.items[0]).toEqual(expect.objectContaining({ id: 'campaign-1', status: 'running', text: 'Hello', version: 3 }));
    expect(result.items[0]).toEqual(expect.objectContaining({
      target: expect.objectContaining({ type: 'group_list', groupListName: 'Branches', groupListVersion: 4, targetCount: 12 }),
      progress: expect.objectContaining({ total: 12, processed: 7, pending: 4, processing: 1, failed: 2 }),
      needsAttention: true,
      statusReason: 'unknown_send_outcome',
      pauseReason: 'operator_attention_required',
      retryAt: '2026-07-27T08:05:00Z',
    }));
    expect(result.items[0]).not.toHaveProperty('instanceId');
  });

  it('submits a versioned Group List target and never exposes consent evidence in normalized history', async () => {
    const recipient = { jid: '84901234567@s.whatsapp.net', optInSource: 'checkout', optInEvidenceReference: 'consent-secret', optedInAt: '2026-07-22T08:00:00Z' };
    const POST = vi.fn().mockResolvedValue(ok({ message: 'success', data: { campaign: { id: 'campaign-1', name: 'Launch', status: 'draft' }, recipientCount: 1, byStatus: { pending: 1 } } }, 201));
    const target = { type: 'group_list' as const, groupListId: 'list-1', groupListVersion: 4 };
    await createCampaign({ POST } as unknown as ApiClient, { name: 'Launch', text: 'Hello', target });
    expect(POST).toHaveBeenCalledWith('/campaigns', { body: { name: 'Launch', text: 'Hello', target } });

    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [{ id: 'recipient-1', recipientJid: recipient.jid, status: 'pending', targetType: 'group', targetLabel: 'Hanoi operations', optInSource: 'checkout', optedInAt: recipient.optedInAt, optInEvidenceReference: 'must-not-pass' }], meta: {} }));
    const result = await listCampaignRecipients({ GET } as unknown as ApiClient, 'campaign-1');
    expect(result.items[0]).not.toHaveProperty('optInEvidenceReference');
    expect(result.items[0]).toEqual(expect.objectContaining({ targetType: 'group', targetLabel: 'Hanoi operations' }));
  });

  it('uses authoritative detail progress without recomputing terminal outcomes', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: { campaign: { id: 'campaign-1', status: 'paused', needsAttention: false }, recipientCount: 10, byStatus: { sent: 8, failed: 1 }, progress: { total: 10, processed: 4, sent: 8, failed: 1 }, target: { type: 'group_list', targetCount: 10 }, needsAttention: true, pauseReason: 'provider_rate_limited' } }));
    const result = await getCampaign({ GET } as unknown as ApiClient, 'campaign-1');
    expect(result.campaign.progress).toEqual(expect.objectContaining({ total: 10, processed: 4, sent: 8, failed: 1 }));
    expect(result.campaign.needsAttention).toBe(true);
    expect(result.campaign.pauseReason).toBe('provider_rate_limited');
  });

  it('maps lifecycle actions to authoritative backend transitions', async () => {
    const POST = vi.fn().mockResolvedValue(ok({ message: 'success', data: { campaign: { id: 'campaign-1', status: 'paused' }, recipientCount: 2, byStatus: {} } }));
    const result = await transitionCampaign({ POST } as unknown as ApiClient, 'campaign-1', 'pause');
    expect(POST).toHaveBeenCalledWith('/campaigns/{campaignId}/pause', { params: { path: { campaignId: 'campaign-1' } } });
    expect(result.campaign.status).toBe('paused');
  });
});
