export const queryKeys = {
  health: ['health'] as const,
  healthReadiness: ['health', 'readiness'] as const,
  dashboard: ['dashboard'] as const,
  queueMetrics: ['metrics', 'queue'] as const,
  messageMetrics: ['metrics', 'messages'] as const,
  webhookMetrics: ['metrics', 'webhooks'] as const,
  mediaMetrics: ['metrics', 'media'] as const,
  actionRequired: ['action-required'] as const,
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
