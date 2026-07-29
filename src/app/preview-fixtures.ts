/* Dev-only sample data for rendering v3 surfaces without a backend (/__preview). */
import type { Campaign } from '@/api/campaigns';
import type { ChatResource } from '@/api/chats';
import type { ContactResource } from '@/api/contacts';
import type { EventResource } from '@/api/events-api';
import type { GroupResource } from '@/api/groups';
import type { InstanceResource } from '@/api/instances';
import type { LabelResource } from '@/api/labels';
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
  { resourceType: 'chat', id: '15551230001@s.whatsapp.net', contactId: '9c37e2c7-875c-48ff-a298-00b853409cb1', displayName: 'Anna Nguyen', displayNameSource: 'full_name', type: 'direct', unreadCount: 2, lastActivityAt: ago(300) },
  { resourceType: 'chat', id: '15551230002@s.whatsapp.net', displayName: 'Support escalations', type: 'group', unreadCount: 0, lastActivityAt: ago(3600) },
  { resourceType: 'chat', id: '15551230003@s.whatsapp.net', contactId: 'b1277eeb-fccb-4909-a514-d4a3ca5f2a26', displayName: 'David Tran', displayNameSource: 'push_name', type: 'direct', unreadCount: 5, lastActivityAt: ago(120) },
  { resourceType: 'chat', id: '15551230004@s.whatsapp.net', displayName: 'Orders', type: 'group', unreadCount: 0, lastActivityAt: ago(86_400) },
];

export const contactsFixture: ContactResource[] = [
  { resourceType: 'contact', id: '9c37e2c7-875c-48ff-a298-00b853409cb1', addressingJid: '15551230001@s.whatsapp.net', aliases: ['15551230001@s.whatsapp.net', '731002@lid'], identityStatus: 'complete', identityUpdatedAt: ago(900), displayName: 'Anna Nguyen', displayNameSource: 'full_name', found: true },
  { resourceType: 'contact', id: 'b1277eeb-fccb-4909-a514-d4a3ca5f2a26', addressingJid: '15551230003@s.whatsapp.net', aliases: ['15551230003@s.whatsapp.net'], identityStatus: 'partial', identityUpdatedAt: ago(120), displayName: 'David Tran', displayNameSource: 'push_name', found: true },
  { resourceType: 'contact', id: 'c7a3486f-b861-4aa4-8565-43170f33dde0', addressingJid: '15551230005@s.whatsapp.net', aliases: [], identityStatus: 'partial', identityUpdatedAt: ago(60), found: false },
];

export const labelsFixture: LabelResource[] = [
  { resourceType: 'label', id: 'label_1', name: 'Priority', color: '1' },
  { resourceType: 'label', id: 'label_2', name: 'Follow up', color: '2' },
];

export const messagesFixture: MessageResource[] = [
  { resourceType: 'message', id: 'msg_1', chatId: '15551230001@s.whatsapp.net', direction: 'incoming', type: 'text', status: 'read', contentText: 'Hi! Is my order shipped yet?', createdAt: ago(3000), provenance: 'live' },
  { resourceType: 'message', id: 'msg_2', chatId: '15551230001@s.whatsapp.net', direction: 'outgoing', type: 'text', status: 'delivered', contentText: 'Hello Anna — yes, it shipped this morning. Tracking is on the way.', createdAt: ago(2400), provenance: 'write_through' },
  { resourceType: 'message', id: 'msg_3', chatId: '15551230001@s.whatsapp.net', direction: 'incoming', type: 'image', mediaType: 'image', mediaAssetId: 'asset_ready', caption: 'Package at the front desk', status: 'read', createdAt: ago(1800), provenance: 'live' },
  { resourceType: 'message', id: 'msg_4', chatId: '15551230001@s.whatsapp.net', direction: 'incoming', type: 'image', mediaType: 'image', mediaAssetId: 'asset_processing', contentSummary: 'Incoming image', status: 'delivered', createdAt: ago(900), provenance: 'live' },
  { resourceType: 'message', id: 'msg_5', chatId: '15551230001@s.whatsapp.net', direction: 'outgoing', type: 'text', status: 'failed', contentText: 'Let me know if you need anything else.', createdAt: ago(300), provenance: 'write_through' },
];

export const groupsFixture: GroupResource[] = [
  { id: '120363001@g.us', normalized: true, subject: 'Support escalations', groupType: 'group', sendMode: 'admins_only', status: 'active', memberCount: 42, adminCount: 4, updatedAt: ago(1800), announce: true, members: [] },
  { id: '120363002@g.us', normalized: true, subject: 'Order fulfilment', groupType: 'subgroup', sendMode: 'all_members', status: 'active', memberCount: 12, adminCount: 2, updatedAt: ago(86_400), announce: false, members: [] },
  { id: '120363003@g.us', normalized: true, subject: 'VIP customers', groupType: 'community', sendMode: 'admins_only', status: 'suspended', memberCount: 8, adminCount: 1, updatedAt: ago(86_400 * 7), announce: true, members: [] },
] as unknown as GroupResource[];

export const groupDetailFixture = {
  id: '120363001@g.us',
  normalized: true,
  subject: 'Support escalations',
  groupType: 'group',
  sendMode: 'admins_only',
  status: 'active',
  membershipState: 'joined',
  myRole: 'admin',
  memberCount: 42,
  adminCount: 4,
  updatedAt: ago(1800),
  actions: {
    sendMessage: { state: 'allowed' },
    editName: { state: 'allowed' },
    editDescription: { state: 'allowed' },
    editSettings: { state: 'allowed' },
    addMembers: { state: 'allowed' },
    removeMembers: { state: 'allowed' },
    promoteMembers: { state: 'allowed' },
    demoteMembers: { state: 'denied', reason: 'owner_required' },
    readInviteLink: { state: 'allowed' },
    resetInviteLink: { state: 'allowed' },
    setPhoto: { state: 'unknown', reason: 'permission_unknown' },
    leaveGroup: { state: 'allowed' },
  },
  members: [],
} as unknown as GroupResource;

const campaignProgress = (total: number, processed: number, failed = 0, skipped = 0): Campaign['progress'] => ({
  total, processed, pending: Math.max(0, total - processed), processing: 0,
  sent: Math.max(0, processed - failed - skipped), delivered: 0, read: 0,
  failed, skipped, aborted: 0, updatedAt: ago(120),
});
const campaignTarget = (name: string, count: number, version = 1): Campaign['target'] => ({
  type: 'group_list', groupListId: `list_${name.toLowerCase().replaceAll(' ', '_')}`,
  groupListName: name, groupListVersion: version, targetCount: count,
});

export const campaignsFixture: Campaign[] = [
  { id: 'cmp_01HB', name: 'July promo blast', status: 'running', startsAt: ago(3600), updatedAt: ago(120), version: 4, target: campaignTarget('Retail stores', 1284, 4), progress: { ...campaignProgress(1284, 960, 30, 12), pending: 320, processing: 4 }, needsAttention: false },
  { id: 'cmp_02KC', name: 'Cart abandonment', status: 'scheduled', startsAt: ago(-7200), updatedAt: ago(600), version: 1, target: campaignTarget('Recovery teams', 96), progress: campaignProgress(96, 0), needsAttention: false, retryAt: ago(-600) },
  { id: 'cmp_03QD', name: 'Welcome series', status: 'completed', startsAt: ago(86_400 * 3), updatedAt: ago(86_400 * 2), version: 7, target: campaignTarget('New branches', 84, 2), progress: campaignProgress(84, 84), needsAttention: false },
  { id: 'cmp_04TE', name: 'Flash sale', status: 'aborted', startsAt: ago(86_400), updatedAt: ago(80_000), version: 2, target: campaignTarget('VIP stores', 42, 3), progress: { ...campaignProgress(42, 42), sent: 20, aborted: 22 }, needsAttention: false },
  { id: 'cmp_05WF', name: 'Feedback request', status: 'paused', startsAt: undefined, updatedAt: ago(300), version: 1, target: campaignTarget('Support teams', 32), progress: campaignProgress(32, 8, 1), needsAttention: true, statusReason: 'unknown_send_outcome', pauseReason: 'operator_attention_required' },
] as unknown as Campaign[];

export const campaignDetailFixture = {
  campaign: { id: 'cmp_01HB', name: 'July promo blast', status: 'running', contentType: 'text', text: 'Hi {{name}}! Our July sale is live — 25% off everything through Sunday. Reply STOP to opt out.', startsAt: ago(3600), finishedAt: undefined, updatedAt: ago(120), version: 4, target: campaignTarget('Retail stores', 1284, 4), progress: { ...campaignProgress(1284, 960, 30, 12), processing: 4, pending: 320 }, needsAttention: false } as Campaign,
  recipientCount: 1284,
  byStatus: { delivered: 918, processing: 240, queued: 84, failed: 30, skipped: 12 },
};

export const eventsFixture: EventResource[] = [
  { id: 'evt_01HZX9', type: 'message.received', occurredAt: ago(60), ingestedAt: ago(59), summary: { chatId: '15551230001@s.whatsapp.net', direction: 'incoming', messageType: 'text' } },
  { id: 'evt_02KQP7', type: 'instance.connected', occurredAt: ago(300), ingestedAt: ago(300), summary: { instanceId: 'inst_01HZX', connected: true } },
  { id: 'evt_03TMR3', type: 'campaign.transition', occurredAt: ago(900), ingestedAt: ago(899), summary: { campaignId: 'cmp_01HB', fromStatus: 'scheduled', toStatus: 'running' } },
  { id: 'evt_04WLK1', type: 'message.status', occurredAt: ago(1200), ingestedAt: ago(1200), summary: { messageId: 'msg_2', status: 'delivered' } },
] as unknown as EventResource[];

export const eventDetailFixture = eventsFixture[0];

export const healthFixture: ServerHealthResource = {
  generatedAt: ago(30),
  api: { status: 'healthy' },
  instances: [
    { instanceId: 'inst_01HZX', connection: { status: 'connected', connected: true }, projection: { status: 'ready', byStatus: {}, resources: [] }, throttling: { status: 'nominal', observed: false, circuitState: 'closed' } },
    { instanceId: 'inst_02KQP', connection: { status: 'connected', connected: true }, projection: { status: 'syncing', byStatus: {}, resources: [] }, throttling: { status: 'throttled', observed: true, circuitState: 'half-open', retryAfterSeconds: 12 } },
    { instanceId: 'inst_07TMR', connection: { status: 'disconnected', connected: false }, projection: { status: 'failed', byStatus: {}, resources: [] }, throttling: { status: 'nominal', observed: false, circuitState: 'closed' } },
  ],
};
