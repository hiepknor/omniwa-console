export const queryKeys = {
  capabilities: (scope: string) => ['capabilities', scope] as const,
  health: ['health'] as const,
  healthReadiness: ['health', 'readiness'] as const,
  overview: (window: string) => ['overview', window] as const,
  queueMetrics: ['metrics', 'queue'] as const,
  messageMetrics: ['metrics', 'messages'] as const,
  webhookMetrics: ['metrics', 'webhooks'] as const,
  mediaMetrics: ['metrics', 'media'] as const,
  actionRequired: ['action-required'] as const,
  instances: (params?: { initialCursor?: string }) => ['instances', params ?? {}] as const,
  instance: (instanceId: string) => ['instances', instanceId] as const,
  instanceSessions: (instanceId: string) => ['instances', instanceId, 'sessions'] as const,
  instanceChats: (instanceId: string, params?: Record<string, unknown>) =>
    ['instances', instanceId, 'chats', params ?? {}] as const,
  instanceGroups: (instanceId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'groups'] as const
      : ['instances', instanceId, 'groups', params] as const,
  group: (instanceId: string, groupId: string) => ['instances', instanceId, 'group', groupId] as const,
  chat: (instanceId: string, chatId: string) => ['instances', instanceId, 'chat', chatId] as const,
  instanceMessages: (instanceId: string, chatId: string, params?: Record<string, unknown>) =>
    ['instances', instanceId, 'chats', chatId, 'messages', params ?? {}] as const,
  message: (instanceId: string, messageId: string) => ['instances', instanceId, 'message', messageId] as const,
  messageDeliveryHistory: (instanceId: string, messageId: string) =>
    ['instances', instanceId, 'message', messageId, 'delivery-history'] as const,
  instanceContacts: (instanceId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'contacts'] as const
      : ['instances', instanceId, 'contacts', params] as const,
  contact: (instanceId: string, contactId: string) => ['instances', instanceId, 'contact', contactId] as const,
  instanceLabels: (instanceId: string) => ['instances', instanceId, 'labels'] as const,
  label: (instanceId: string, labelId: string) => ['instances', instanceId, 'label', labelId] as const,
  media: (mediaId: string) => ['media', mediaId] as const,
  providerCapabilities: ['provider', 'capabilities'] as const,
  queueStatus: ['queue', 'status'] as const,
  jobs: (params?: Record<string, unknown>) => ['jobs', params ?? {}] as const,
  instanceCampaigns: (instanceId: string, params?: Record<string, unknown>) => ['instances', instanceId, 'campaigns', params ?? {}] as const,
  campaign: (instanceId: string, campaignId: string) => ['instances', instanceId, 'campaigns', campaignId] as const,
  campaignRecipients: (instanceId: string, campaignId: string) => ['instances', instanceId, 'campaigns', campaignId, 'recipients'] as const,
  campaignAudit: (instanceId: string, campaignId: string) => ['instances', instanceId, 'campaigns', campaignId, 'audit'] as const,
  job: (jobId: string) => ['jobs', jobId] as const,
  webhooks: (params?: Record<string, unknown>) => ['webhooks', params ?? {}] as const,
  webhook: (webhookId: string) => ['webhooks', webhookId] as const,
  webhookDeliveries: (params?: Record<string, unknown>) =>
    ['webhook-deliveries', params ?? {}] as const,
  webhookDeliveryHistory: (deliveryId: string) =>
    ['webhook-deliveries', deliveryId, 'history'] as const,
  instanceEvents: (instanceId: string, params?: Record<string, unknown>) =>
    ['instances', instanceId, 'events', params ?? {}] as const,
  auditRecords: (params?: Record<string, unknown>) => ['audit-records', params ?? {}] as const,
  settings: ['settings'] as const,
  apiKeys: (params?: Record<string, unknown>) => ['api-keys', params ?? {}] as const,
};

export const overviewKeys = [
  queryKeys.health,
  queryKeys.healthReadiness,
  queryKeys.overview('24h'),
  queryKeys.queueMetrics,
  queryKeys.messageMetrics,
  queryKeys.webhookMetrics,
  queryKeys.mediaMetrics,
  queryKeys.actionRequired,
] as const;

export const instanceKeys = {
  root: ['instances'] as const,
  provider: ['provider', 'capabilities'] as const,
};

export const messageKeys = {
  root: ['messages'] as const,
  chats: ['chats'] as const,
  contacts: ['contacts'] as const,
};

export const opsKeys = {
  groups: ['groups'] as const,
  settings: ['settings'] as const,
  apiKeys: ['api-keys'] as const,
  queue: ['queue'] as const,
  jobs: ['jobs'] as const,
  webhooks: ['webhooks'] as const,
  webhookDeliveries: ['webhook-deliveries'] as const,
  events: ['events'] as const,
  auditRecords: ['audit-records'] as const,
};

export const realtimeGapKeys = [
  ...overviewKeys,
  instanceKeys.root,
  queryKeys.providerCapabilities,
  opsKeys.events,
] as const;
