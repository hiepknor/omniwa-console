import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { createCampaign, listCampaignRecipients, listCampaigns, transitionCampaign } from './campaigns';

function ok(data: unknown, status = 200) { return { data, response: new Response(null, { status }) }; }

describe('campaign orchestration adapter', () => {
  it('preserves instance-scoped campaign status and opaque pagination', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [{ id: 'campaign-1', name: 'Launch', status: 'running', textBody: 'Hello', version: 3, instanceId: 'must-not-pass' }], meta: { nextCursor: 'opaque/next' } }));
    const result = await listCampaigns({ GET } as unknown as ApiClient, { status: 'running', cursor: 'opaque/current', limit: 25 });
    expect(GET).toHaveBeenCalledWith('/campaigns', { params: { query: { status: 'running', cursor: 'opaque/current', limit: 25 } } });
    expect(result.nextCursor).toBe('opaque/next');
    expect(result.items[0]).toEqual(expect.objectContaining({ id: 'campaign-1', status: 'running', text: 'Hello', version: 3 }));
    expect(result.items[0]).not.toHaveProperty('instanceId');
  });

  it('submits consent evidence but never exposes it in normalized recipient state', async () => {
    const recipient = { jid: '84901234567@s.whatsapp.net', optInSource: 'checkout', optInEvidenceReference: 'consent-secret', optedInAt: '2026-07-22T08:00:00Z' };
    const POST = vi.fn().mockResolvedValue(ok({ message: 'success', data: { campaign: { id: 'campaign-1', name: 'Launch', status: 'draft' }, recipientCount: 1, byStatus: { pending: 1 } } }, 201));
    await createCampaign({ POST } as unknown as ApiClient, { name: 'Launch', text: 'Hello', recipients: [recipient] });
    expect(POST).toHaveBeenCalledWith('/campaigns', { body: { name: 'Launch', text: 'Hello', recipients: [recipient] } });

    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [{ id: 'recipient-1', recipientJid: recipient.jid, status: 'pending', optInSource: 'checkout', optedInAt: recipient.optedInAt, optInEvidenceReference: 'must-not-pass' }], meta: {} }));
    const result = await listCampaignRecipients({ GET } as unknown as ApiClient, 'campaign-1');
    expect(result.items[0]).not.toHaveProperty('optInEvidenceReference');
  });

  it('maps lifecycle actions to authoritative backend transitions', async () => {
    const POST = vi.fn().mockResolvedValue(ok({ message: 'success', data: { campaign: { id: 'campaign-1', status: 'paused' }, recipientCount: 2, byStatus: {} } }));
    const result = await transitionCampaign({ POST } as unknown as ApiClient, 'campaign-1', 'pause');
    expect(POST).toHaveBeenCalledWith('/campaigns/{campaignId}/pause', { params: { path: { campaignId: 'campaign-1' } } });
    expect(result.campaign.status).toBe('paused');
  });
});
