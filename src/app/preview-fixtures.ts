/* Dev-only sample data for rendering v3 surfaces without a backend (/__preview). */
import type { ChatResource } from '@/api/chats';
import type { InstanceResource } from '@/api/instances';
import type { MessageResource } from '@/api/messages';
import type { OverviewResource, ProjectionHealthResource, ServerHealthResource } from '@/api/overview';
import type { ProjectionFailure } from '@/api/recovery';

const now = Date.now();
const ago = (s: number) => new Date(now - s * 1000).toISOString();

export const overviewFixture: OverviewResource = {
  generatedAt: ago(42),
  scope: { type: 'server' },
  window: { start: ago(86_400), end: ago(0), durationSeconds: 86_400 },
  instances: { total: 18, connected: 15, disconnected: 3 },
  projections: { groups: 214, contacts: 8_642, chats: 1_930, messages: 482_119, events: 91_004 },
  messages: { total: 482_119, incoming: 301_442, outgoing: 180_677 },
};

export const projectionFixture: ProjectionHealthResource = {
  generatedAt: ago(55),
  status: 'degraded',
  total: 6,
  byStatus: { ready: 4, syncing: 1, failed: 1 },
  resources: [
    { resource: 'messages', instanceId: 'inst_01HZX', syncStatus: 'ready', pendingEvents: 0, deadLetterEvents: 0, eventLagSeconds: 1 },
    { resource: 'chats', instanceId: 'inst_01HZX', syncStatus: 'ready', pendingEvents: 3, deadLetterEvents: 0, eventLagSeconds: 2 },
    { resource: 'groups', instanceId: 'inst_02KQP', syncStatus: 'syncing', pendingEvents: 142, deadLetterEvents: 0, eventLagSeconds: 38 },
    { resource: 'contacts', instanceId: 'inst_02KQP', syncStatus: 'ready', pendingEvents: 0, deadLetterEvents: 0, eventLagSeconds: 0 },
    { resource: 'events', instanceId: 'inst_07TMR', syncStatus: 'failed', pendingEvents: 12, deadLetterEvents: 4, eventLagSeconds: 611 },
    { resource: 'messages', instanceId: 'inst_07TMR', syncStatus: 'ready', pendingEvents: 0, deadLetterEvents: 0, eventLagSeconds: 3 },
  ],
};

export const instancesFixture: InstanceResource[] = [
  { id: 'inst_01HZX9Q2', displayName: 'Sales bot', status: 'connected', connected: true, credentialVersion: 3, createdAt: ago(86_400 * 12), jid: '15551230001@s.whatsapp.net' },
  { id: 'inst_02KQP7M4', displayName: 'Support line', status: 'connected', connected: true, credentialVersion: 1, createdAt: ago(86_400 * 5), jid: '15551230002@s.whatsapp.net' },
  { id: 'inst_07TMR3B9', displayName: 'Marketing blast', status: 'disconnected', connected: false, credentialVersion: 2, createdAt: ago(86_400 * 30), jid: undefined },
  { id: 'inst_09WLK1C6', displayName: 'Onboarding', status: 'disconnected', connected: false, createdAt: ago(3600), jid: undefined },
] as unknown as InstanceResource[];

export const failuresFixture: ProjectionFailure[] = [
  { instanceId: 'inst_07TMR3B9', resource: 'events', eventKey: 'evt_9f21c7a4', eventType: 'message.received', failureClass: 'deserialize_error', lastErrorCode: 'schema_mismatch', retryCount: 5, maxAttempts: 5, occurredAt: ago(900), lastAttemptAt: ago(120), deadLetteredAt: ago(90) },
  { instanceId: 'inst_02KQP7M4', resource: 'chats', eventKey: 'evt_4b0e1d92', eventType: 'chat.updated', failureClass: 'constraint_violation', lastErrorCode: 'fk_missing', retryCount: 3, maxAttempts: 5, occurredAt: ago(3600), lastAttemptAt: ago(1800), deadLetteredAt: ago(1700) },
  { instanceId: 'inst_02KQP7M4', resource: 'groups', eventKey: 'evt_77aa02fe', eventType: 'group.member.added', failureClass: 'timeout', lastErrorCode: 'downstream_timeout', retryCount: 5, maxAttempts: 5, occurredAt: ago(7200), lastAttemptAt: ago(600), deadLetteredAt: ago(540) },
] as unknown as ProjectionFailure[];

export const chatsFixture: ChatResource[] = [
  { id: '15551230001@s.whatsapp.net', displayName: 'Anna Nguyen', type: 'individual', unreadCount: 2, lastActivityAt: ago(300) },
  { id: '15551230002@s.whatsapp.net', displayName: 'Support escalations', type: 'group', unreadCount: 0, lastActivityAt: ago(3600) },
  { id: '15551230003@s.whatsapp.net', displayName: 'David Tran', type: 'individual', unreadCount: 5, lastActivityAt: ago(120) },
  { id: '15551230004@s.whatsapp.net', displayName: 'Orders', type: 'group', unreadCount: 0, lastActivityAt: ago(86_400) },
] as unknown as ChatResource[];

export const messagesFixture: MessageResource[] = [
  { id: 'msg_1', chatId: '15551230001@s.whatsapp.net', direction: 'incoming', type: 'text', status: 'read', contentText: 'Hi! Is my order shipped yet?', createdAt: ago(3000), provenance: 'whatsapp' },
  { id: 'msg_2', chatId: '15551230001@s.whatsapp.net', direction: 'outgoing', type: 'text', status: 'delivered', contentText: 'Hello Anna — yes, it shipped this morning. Tracking is on the way.', createdAt: ago(2400), provenance: 'console' },
  { id: 'msg_3', chatId: '15551230001@s.whatsapp.net', direction: 'incoming', type: 'text', status: 'read', contentText: 'Perfect, thank you!', createdAt: ago(1800), provenance: 'whatsapp' },
  { id: 'msg_4', chatId: '15551230001@s.whatsapp.net', direction: 'outgoing', type: 'text', status: 'failed', contentText: 'Let me know if you need anything else.', createdAt: ago(300), provenance: 'console' },
] as unknown as MessageResource[];

export const healthFixture: ServerHealthResource = {
  generatedAt: ago(30),
  api: { status: 'healthy' },
  instances: [
    { instanceId: 'inst_01HZX', connection: { status: 'connected', connected: true }, projection: { status: 'ready', byStatus: {}, resources: [] }, throttling: { status: 'nominal', observed: false, circuitState: 'closed' } },
    { instanceId: 'inst_02KQP', connection: { status: 'connected', connected: true }, projection: { status: 'syncing', byStatus: {}, resources: [] }, throttling: { status: 'throttled', observed: true, circuitState: 'half-open', retryAfterSeconds: 12 } },
    { instanceId: 'inst_07TMR', connection: { status: 'disconnected', connected: false }, projection: { status: 'failed', byStatus: {}, resources: [] }, throttling: { status: 'nominal', observed: false, circuitState: 'closed' } },
  ],
};
