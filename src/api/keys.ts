export const queryKeys = {
  health: ['health'] as const,
  healthReadiness: ['health', 'readiness'] as const,
  dashboard: ['dashboard'] as const,
  queueMetrics: ['metrics', 'queue'] as const,
  messageMetrics: ['metrics', 'messages'] as const,
  webhookMetrics: ['metrics', 'webhooks'] as const,
  mediaMetrics: ['metrics', 'media'] as const,
  actionRequired: ['action-required'] as const,
  instances: (params?: { initialCursor?: string }) => ['instances', params ?? {}] as const,
  instance: (instanceId: string) => ['instances', instanceId] as const,
  instanceSessions: (instanceId: string) => ['instances', instanceId, 'sessions'] as const,
  providerCapabilities: ['provider', 'capabilities'] as const,
};

export const overviewKeys = [
  queryKeys.health,
  queryKeys.healthReadiness,
  queryKeys.dashboard,
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

export const realtimeGapKeys = [
  ...overviewKeys,
  instanceKeys.root,
  queryKeys.providerCapabilities,
] as const;
