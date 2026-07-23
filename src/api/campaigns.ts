import type { ApiClient } from './client';
import { unwrap } from './envelopes';
import type { components } from './generated/schema';

type CampaignPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_campaign_model.Campaign'];
type RecipientPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_campaign_model.Recipient'];
type AuditPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_campaign_model.AuditEvent'];
type DetailPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_campaign_service.CampaignDetail'];

export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'aborted' | 'failed';
export type RecipientStatus = 'pending' | 'processing' | 'sent' | 'delivered' | 'read' | 'failed' | 'skipped' | 'aborted';
export type Campaign = { id: string; name: string; status: CampaignStatus; contentType: string; text: string; startsAt?: string; finishedAt?: string; createdAt?: string; updatedAt?: string; version: number };
export type CampaignDetail = { campaign: Campaign; recipientCount: number; byStatus: Readonly<Record<string, number>> };
export type CampaignRecipient = { id: string; jid: string; status: RecipientStatus; optInSource: string; optedInAt?: string; attemptCount: number; providerMessageId?: string; sentAt?: string; deliveredAt?: string; readAt?: string; lastErrorCode?: string; nextAttemptAt?: string; updatedAt?: string };
export type CampaignAudit = { id: string; eventType: string; actorType: string; recipientId?: string; fromStatus?: string; toStatus?: string; occurredAt?: string };
export type CampaignPage<T> = { items: T[]; nextCursor: string | null };
export type CampaignRecipientConsent = { jid: string; optInSource: string; optInEvidenceReference: string; optedInAt: string };

const campaignStatuses: CampaignStatus[] = ['draft', 'scheduled', 'running', 'paused', 'completed', 'aborted', 'failed'];
const recipientStatuses: RecipientStatus[] = ['pending', 'processing', 'sent', 'delivered', 'read', 'failed', 'skipped', 'aborted'];
function value<T extends string>(candidate: string | undefined, allowed: readonly T[], fallback: T): T { return allowed.includes(candidate as T) ? candidate as T : fallback; }
function text(candidate: string | undefined, fallback = ''): string { return candidate?.trim() || fallback; }
function campaign(payload: CampaignPayload | undefined): Campaign {
  return { id: text(payload?.id), name: text(payload?.name, 'Untitled campaign'), status: value(payload?.status, campaignStatuses, 'failed'), contentType: text(payload?.contentType, 'text'), text: payload?.textBody ?? '', startsAt: payload?.startsAt, finishedAt: payload?.finishedAt, createdAt: payload?.createdAt, updatedAt: payload?.updatedAt, version: payload?.version ?? 0 };
}
function detail(payload: DetailPayload | undefined): CampaignDetail { return { campaign: campaign(payload?.campaign), recipientCount: Math.max(0, payload?.recipientCount ?? 0), byStatus: { ...(payload?.byStatus ?? {}) } }; }
function cursor(data: unknown): string | null { if (!data || typeof data !== 'object' || !('meta' in data)) return null; const meta = (data as { meta?: unknown }).meta; return meta && typeof meta === 'object' && 'nextCursor' in meta && typeof meta.nextCursor === 'string' && meta.nextCursor ? meta.nextCursor : null; }
function envelopeItems<T>(data: unknown): T[] { return data && typeof data === 'object' && 'data' in data && Array.isArray(data.data) ? data.data as T[] : []; }

export async function listCampaigns(client: ApiClient, params: { status?: CampaignStatus; cursor?: string; limit?: number } = {}): Promise<CampaignPage<Campaign>> {
  const response = await client.GET('/campaigns', { params: { query: { status: params.status, cursor: params.cursor, limit: params.limit ?? 50 } } });
  if (response.data === undefined) return unwrap(response);
  return { items: envelopeItems<CampaignPayload>(response.data).map(campaign).filter((item) => item.id), nextCursor: cursor(response.data) };
}
export async function getCampaign(client: ApiClient, campaignId: string): Promise<CampaignDetail> { return detail(unwrap<DetailPayload>(await client.GET('/campaigns/{campaignId}', { params: { path: { campaignId } } }))); }
export async function listCampaignRecipients(client: ApiClient, campaignId: string, params: { cursor?: string; limit?: number } = {}): Promise<CampaignPage<CampaignRecipient>> {
  const response = await client.GET('/campaigns/{campaignId}/recipients', { params: { path: { campaignId }, query: { cursor: params.cursor, limit: params.limit ?? 50 } } });
  if (response.data === undefined) return unwrap(response);
  return { items: envelopeItems<RecipientPayload>(response.data).map((item) => ({ id: text(item.id), jid: text(item.recipientJid), status: value(item.status, recipientStatuses, 'failed'), optInSource: text(item.optInSource), optedInAt: item.optedInAt, attemptCount: Math.max(0, item.attemptCount ?? 0), providerMessageId: item.providerMessageId, sentAt: item.sentAt, deliveredAt: item.deliveredAt, readAt: item.readAt, lastErrorCode: item.lastErrorCode, nextAttemptAt: item.nextAttemptAt, updatedAt: item.updatedAt })).filter((item) => item.id && item.jid), nextCursor: cursor(response.data) };
}
export async function listCampaignAudit(client: ApiClient, campaignId: string, params: { cursor?: string; limit?: number } = {}): Promise<CampaignPage<CampaignAudit>> {
  const response = await client.GET('/campaigns/{campaignId}/audit', { params: { path: { campaignId }, query: { cursor: params.cursor, limit: params.limit ?? 50 } } });
  if (response.data === undefined) return unwrap(response);
  return { items: envelopeItems<AuditPayload>(response.data).map((item) => ({ id: text(item.id), eventType: text(item.eventType), actorType: text(item.actorType), recipientId: item.recipientId, fromStatus: item.fromStatus, toStatus: item.toStatus, occurredAt: item.occurredAt })).filter((item) => item.id), nextCursor: cursor(response.data) };
}
export async function createCampaign(client: ApiClient, input: { name: string; text: string; recipients: CampaignRecipientConsent[] }): Promise<CampaignDetail> { return detail(unwrap<DetailPayload>(await client.POST('/campaigns', { body: input }))); }
export async function transitionCampaign(client: ApiClient, campaignId: string, action: 'schedule' | 'start' | 'pause' | 'resume' | 'abort', startsAt?: string): Promise<CampaignDetail> {
  if (action === 'schedule') return detail(unwrap<DetailPayload>(await client.POST('/campaigns/{campaignId}/schedule', { params: { path: { campaignId } }, body: { startsAt: startsAt ?? '' } })));
  const paths = { start: '/campaigns/{campaignId}/start', pause: '/campaigns/{campaignId}/pause', resume: '/campaigns/{campaignId}/resume', abort: '/campaigns/{campaignId}/abort' } as const;
  return detail(unwrap<DetailPayload>(await client.POST(paths[action], { params: { path: { campaignId } } })));
}
