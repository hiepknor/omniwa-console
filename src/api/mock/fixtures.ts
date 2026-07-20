import type { PublicData } from '../envelopes';
export { MOCK_API_KEY, MOCK_API_ORIGIN } from './config';

export const MOCK_INSTANCE_ID = 'inst_mock_sales_primary_01';

const now = '2026-07-20T08:30:00.000Z';

export const mockInstances = [
  { resourceType: 'instance', id: MOCK_INSTANCE_ID, status: 'connected', displayName: 'Sales primary', activeSessionId: 'sess_mock_primary', createdAt: '2026-06-02T03:20:00.000Z', updatedAt: now },
  { resourceType: 'instance', id: 'inst_mock_support_long_identifier_02', status: 'connecting', displayName: 'Customer support — North region', createdAt: '2026-06-18T09:10:00.000Z', updatedAt: '2026-07-20T08:28:00.000Z' },
  { resourceType: 'instance', id: 'inst_mock_retail_03', status: 'disconnected', displayName: 'Retail fallback', createdAt: '2026-07-01T02:45:00.000Z', updatedAt: '2026-07-19T17:05:00.000Z' },
] satisfies PublicData[];

export const mockChats = [
  { resourceType: 'chat', id: 'chat_mock_tran_minh_hoa', instanceId: MOCK_INSTANCE_ID, status: 'active', displayName: 'Trần Minh Hòa', type: 'direct', unreadCount: 2, labelIds: ['label_vip'], lastMessageAt: '2026-07-20T08:26:00.000Z', updatedAt: '2026-07-20T08:26:00.000Z' },
  { resourceType: 'chat', id: 'chat_mock_le_thu_cuc_long_identifier', instanceId: MOCK_INSTANCE_ID, status: 'active', displayName: 'Lê Thu Cúc — Đại lý Hà Nội', type: 'direct', unreadCount: 0, labelIds: ['label_lead', 'label_q3'], lastMessageAt: '2026-07-20T08:05:00.000Z', updatedAt: '2026-07-20T08:05:00.000Z' },
  { resourceType: 'chat', id: 'chat_mock_pham_quang_duy', instanceId: MOCK_INSTANCE_ID, status: 'active', displayName: 'Phạm Quang Duy', type: 'direct', unreadCount: 5, labelIds: [], lastMessageAt: '2026-07-20T07:32:00.000Z', updatedAt: '2026-07-20T07:32:00.000Z' },
] satisfies PublicData[];

export const mockMessages = [
  { resourceType: 'message', id: 'msg_mock_in_text_01', instanceId: MOCK_INSTANCE_ID, chatId: 'chat_mock_tran_minh_hoa', status: 'delivered', type: 'text', direction: 'incoming', createdAt: '2026-07-20T08:12:00.000Z', updatedAt: '2026-07-20T08:12:02.000Z', deliveredAt: '2026-07-20T08:12:02.000Z' },
  { resourceType: 'message', id: 'msg_mock_out_delivered_02', instanceId: MOCK_INSTANCE_ID, chatId: 'chat_mock_tran_minh_hoa', status: 'delivered', type: 'text', direction: 'outgoing', createdAt: '2026-07-20T08:14:00.000Z', updatedAt: '2026-07-20T08:14:04.000Z', deliveredAt: '2026-07-20T08:14:04.000Z' },
  { resourceType: 'message', id: 'msg_mock_failed_media_with_an_intentionally_long_identifier_03', instanceId: MOCK_INSTANCE_ID, chatId: 'chat_mock_tran_minh_hoa', status: 'failed', type: 'image', direction: 'outgoing', createdAt: '2026-07-20T08:18:00.000Z', updatedAt: '2026-07-20T08:19:10.000Z' },
  { resourceType: 'message', id: 'msg_mock_queued_04', instanceId: MOCK_INSTANCE_ID, chatId: 'chat_mock_tran_minh_hoa', status: 'queued', type: 'text', direction: 'outgoing', createdAt: '2026-07-20T08:26:00.000Z', updatedAt: '2026-07-20T08:26:00.000Z' },
  { resourceType: 'message', id: 'msg_mock_read_05', instanceId: MOCK_INSTANCE_ID, chatId: 'chat_mock_le_thu_cuc_long_identifier', status: 'read', type: 'document', direction: 'outgoing', createdAt: '2026-07-20T08:05:00.000Z', updatedAt: '2026-07-20T08:07:00.000Z', deliveredAt: '2026-07-20T08:05:04.000Z', readAt: '2026-07-20T08:07:00.000Z' },
] satisfies PublicData[];

export const mockContacts = [
  { resourceType: 'contact', id: 'ctc_mock_tran_minh_hoa', instanceId: MOCK_INSTANCE_ID, status: 'active', displayName: 'Trần Minh Hòa', labelIds: ['label_vip'], updatedAt: now },
  { resourceType: 'contact', id: 'ctc_mock_le_thu_cuc', instanceId: MOCK_INSTANCE_ID, status: 'active', displayName: 'Lê Thu Cúc — Đại lý Hà Nội', labelIds: ['label_lead', 'label_q3'], updatedAt: now },
  { resourceType: 'contact', id: 'ctc_mock_pham_quang_duy', instanceId: MOCK_INSTANCE_ID, status: 'active', displayName: 'Phạm Quang Duy', labelIds: [], updatedAt: now },
] satisfies PublicData[];

export const mockLabels = [
  { resourceType: 'label', id: 'label_vip', instanceId: MOCK_INSTANCE_ID, status: 'active', name: 'vip', color: 'green', updatedAt: now },
  { resourceType: 'label', id: 'label_lead', instanceId: MOCK_INSTANCE_ID, status: 'active', name: 'lead', color: 'yellow', updatedAt: now },
  { resourceType: 'label', id: 'label_q3', instanceId: MOCK_INSTANCE_ID, status: 'active', name: 'q3', color: 'blue', updatedAt: now },
] satisfies PublicData[];

export const mockGroups = [
  { resourceType: 'group', id: 'grp_mock_south_retail_cluster', instanceId: MOCK_INSTANCE_ID, status: 'active', subject: 'South retail cluster', description: 'Regional dealer operations', memberCount: 128, adminCount: 6, muted: false, archived: false, pinned: true, updatedAt: now },
  { resourceType: 'group', id: 'grp_mock_hanoi_dealer_council_with_long_identifier', instanceId: MOCK_INSTANCE_ID, status: 'active', subject: 'Hanoi dealer council — Wholesale partners', description: 'Wholesale announcements and support', memberCount: 84, adminCount: 4, muted: true, archived: false, pinned: false, updatedAt: '2026-07-19T15:20:00.000Z' },
  { resourceType: 'group', id: 'grp_mock_service_advisories', instanceId: MOCK_INSTANCE_ID, status: 'stale', subject: 'Service advisories', description: 'Maintenance window notices', memberCount: 42, adminCount: 3, muted: false, archived: false, pinned: false, updatedAt: '2026-07-10T06:00:00.000Z' },
] satisfies PublicData[];

export const mockGroupMembers = [
  { resourceType: 'groupMember', id: 'gm_mock_01', groupId: 'grp_mock_south_retail_cluster', memberRef: 'member_ref_01', role: 'admin', status: 'active', displayName: 'Nguyễn Anh', joinedAt: '2026-01-02T04:00:00.000Z', updatedAt: now },
  { resourceType: 'groupMember', id: 'gm_mock_02', groupId: 'grp_mock_south_retail_cluster', memberRef: 'member_ref_02', role: 'member', status: 'active', displayName: 'Lê Phương', joinedAt: '2026-02-10T08:30:00.000Z', updatedAt: now },
] satisfies PublicData[];

export const mockJobs = [
  { resourceType: 'job', id: 'job_mock_send_queued', status: 'queued', workType: 'send_message', ownerContext: 'messaging', resourceRef: 'msg_mock_queued_04', attemptCount: 0, createdAt: '2026-07-20T08:26:00.000Z', updatedAt: '2026-07-20T08:26:00.000Z' },
  { resourceType: 'job', id: 'job_mock_webhook_retrying', status: 'retrying', workType: 'webhook_delivery', ownerContext: 'webhooks', resourceRef: 'whd_mock_failed_02', attemptCount: 2, failureCategory: 'infrastructure', reasonCode: 'provider_timeout', createdAt: '2026-07-20T08:10:00.000Z', updatedAt: '2026-07-20T08:24:00.000Z', nextRunAt: '2026-07-20T08:31:00.000Z' },
  { resourceType: 'job', id: 'job_mock_dead_lettered', status: 'dead_lettered', workType: 'media_fetch', ownerContext: 'media', resourceRef: 'med_mock_image_01', attemptCount: 3, failureCategory: 'infrastructure', reasonCode: 'upstream_unavailable', createdAt: '2026-07-20T07:40:00.000Z', updatedAt: '2026-07-20T08:20:00.000Z' },
  { resourceType: 'job', id: 'job_mock_completed', status: 'completed', workType: 'group_sync', ownerContext: 'groups', resourceRef: 'grp_mock_south_retail_cluster', attemptCount: 1, createdAt: '2026-07-20T06:10:00.000Z', updatedAt: '2026-07-20T06:12:00.000Z' },
] satisfies PublicData[];

export const mockWebhooks = [
  { resourceType: 'webhook', id: 'wh_mock_orders_primary', status: 'active', eventTypes: ['message.delivered', 'message.failed'], createdAt: '2026-05-10T02:00:00.000Z', updatedAt: now },
  { resourceType: 'webhook', id: 'wh_mock_crm_sync_long_identifier', status: 'suspended', eventTypes: ['contact.updated', 'group.updated'], createdAt: '2026-06-12T04:00:00.000Z', updatedAt: '2026-07-19T12:00:00.000Z' },
] satisfies PublicData[];

export const mockWebhookDeliveries = [
  { resourceType: 'webhookDelivery', id: 'whd_mock_delivered_01', webhookId: 'wh_mock_orders_primary', status: 'delivered', eventType: 'message.delivered', attemptCount: 1, createdAt: '2026-07-20T08:14:05.000Z', updatedAt: '2026-07-20T08:14:06.000Z' },
  { resourceType: 'webhookDelivery', id: 'whd_mock_failed_02', webhookId: 'wh_mock_orders_primary', status: 'failed', eventType: 'message.failed', attemptCount: 3, createdAt: '2026-07-20T08:19:11.000Z', updatedAt: '2026-07-20T08:24:00.000Z' },
  { resourceType: 'webhookDelivery', id: 'whd_mock_retrying_03', webhookId: 'wh_mock_crm_sync_long_identifier', status: 'retrying', eventType: 'contact.updated', attemptCount: 2, createdAt: '2026-07-20T08:00:00.000Z', updatedAt: '2026-07-20T08:25:00.000Z', nextRetryAt: '2026-07-20T08:31:00.000Z' },
] satisfies PublicData[];

export const mockEvents = [
  { resourceType: 'event', id: 'evt_mock_01', type: 'message.delivered', source: 'messaging', resourceRef: 'msg_mock_out_delivered_02', correlationId: 'corr_mock_01', timestamp: '2026-07-20T08:14:04.000Z' },
  { resourceType: 'event', id: 'evt_mock_02', type: 'webhook.delivery.failed', source: 'webhooks', resourceRef: 'whd_mock_failed_02', correlationId: 'corr_mock_02', timestamp: '2026-07-20T08:24:00.000Z' },
  { resourceType: 'event', id: 'evt_mock_03', type: 'instance.connected', source: 'instances', resourceRef: MOCK_INSTANCE_ID, correlationId: 'corr_mock_03', timestamp: '2026-07-20T07:50:00.000Z' },
] satisfies PublicData[];

export const mockAuditRecords = [
  { resourceType: 'auditRecord', id: 'audit_mock_01', category: 'command', status: 'accepted', action: 'message.send', auditedResourceType: 'message', resourceRef: 'msg_mock_queued_04', createdAt: '2026-07-20T08:26:00.000Z' },
  { resourceType: 'auditRecord', id: 'audit_mock_02', category: 'configuration', status: 'completed', action: 'webhook.suspend', auditedResourceType: 'webhook', resourceRef: 'wh_mock_crm_sync_long_identifier', createdAt: '2026-07-19T12:00:00.000Z' },
] satisfies PublicData[];

export const mockApiKeys = [
  { resourceType: 'apiKey', id: 'key_mock_admin_01', kind: 'admin_key', scopes: ['admin', 'read', 'write'], status: 'active', createdAt: '2026-05-01T00:00:00.000Z', updatedAt: now },
  { resourceType: 'apiKey', id: 'key_mock_monitoring_02', kind: 'monitoring_key', scopes: ['health:read', 'metrics:read'], status: 'active', createdAt: '2026-06-15T00:00:00.000Z', updatedAt: '2026-07-18T03:00:00.000Z' },
  { resourceType: 'apiKey', id: 'key_mock_revoked_03', kind: 'api_key', scopes: ['instances:read'], status: 'revoked', createdAt: '2026-04-02T00:00:00.000Z', updatedAt: '2026-07-01T02:00:00.000Z', revokedAt: '2026-07-01T02:00:00.000Z', revocationReasonCode: 'operator_request' },
] satisfies PublicData[];

export const mockSingletons = {
  health: { resourceType: 'health', id: 'health_api', status: 'alive', category: 'api', checkedAt: now, updatedAt: now },
  readiness: { resourceType: 'health', id: 'health_readiness', status: 'ready', category: 'readiness', checkedAt: now, updatedAt: now },
  dashboard: { resourceType: 'dashboard', id: 'dashboard_mock', instanceCount: 3, connectedInstanceCount: 1, queuedJobCount: 2, failedWebhookCount: 1, updatedAt: now },
  queue: { resourceType: 'metrics', id: 'queue', totalJobCount: 24, queuedJobCount: 2, reservedJobCount: 1, runningJobCount: 2, retryingJobCount: 1, completedJobCount: 17, deadJobCount: 1, activeJobCount: 6, status: 'degraded', updatedAt: now },
  messages: { resourceType: 'metrics', id: 'messages', value: 1284, count: 1284, status: 'available', updatedAt: now },
  webhooks: { resourceType: 'metrics', id: 'webhooks', value: 312, count: 312, status: 'degraded', updatedAt: now },
  media: { resourceType: 'metrics', id: 'media', value: 86, count: 86, status: 'available', updatedAt: now },
  settings: { resourceType: 'settings', id: 'settings_active', status: 'active', profile: 'local-development', updatedAt: now },
  provider: { resourceType: 'provider', id: 'provider_whatsapp', status: 'available', providerName: 'WhatsApp Web', capabilities: ['messages.text', 'messages.media', 'groups', 'contacts', 'labels'], updatedAt: now },
  session: { resourceType: 'session', id: 'sess_mock_primary', instanceId: MOCK_INSTANCE_ID, status: 'active', createdAt: '2026-07-20T07:50:00.000Z', updatedAt: now, expiresAt: '2026-07-21T07:50:00.000Z' },
  mediaResource: { resourceType: 'media', id: 'med_mock_image_01', instanceId: MOCK_INSTANCE_ID, status: 'registered', mediaType: 'image', contentType: 'image/jpeg', sizeBytes: 248320, createdAt: '2026-07-20T08:17:00.000Z', expiresAt: '2026-07-21T08:17:00.000Z' },
} satisfies Record<string, PublicData>;

export const mockActionRequired = [
  { resourceType: 'health', id: 'action_webhook_failure', status: 'needs_review', category: 'webhook', subjectRef: 'whd_mock_failed_02', checkedAt: now, updatedAt: now },
  { resourceType: 'health', id: 'action_dead_letter', status: 'needs_review', category: 'queue', subjectRef: 'job_mock_dead_lettered', checkedAt: now, updatedAt: now },
] satisfies PublicData[];
