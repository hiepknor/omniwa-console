export const SESSION_QUERY_SCOPE = 'session' as const;

export const queryKeys = {
  capabilities: (scope: string) => ['capabilities', scope] as const,
  health: ['health'] as const,
  projectionHealth: ['health', 'projection'] as const,
  overview: (window: string) => ['overview', window] as const,
  projectionFailuresRoot: ['projection-failures'] as const,
  projectionFailures: (params: { instanceId?: string; resource?: string; limit: number; cursor?: string }) =>
    ['projection-failures', params] as const,
  instances: (params?: { initialCursor?: string; metadata?: boolean }) => ['instances', params ?? {}] as const,
  instanceCredentialHealth: ['instances', 'credential-health'] as const,
  instance: (instanceId: string) => ['instances', instanceId] as const,
  instanceMetadata: (instanceId: string, metadata: boolean) =>
    ['instances', instanceId, { metadata }] as const,
  instanceStatus: (instanceId: string) => ['instances', instanceId, 'status'] as const,
  instanceQr: (instanceId: string) => ['instances', instanceId, 'qr'] as const,
  instanceAdvancedSettings: (instanceId: string) =>
    ['instances', instanceId, 'advanced-settings'] as const,
  instanceChats: (instanceId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'chats'] as const
      : ['instances', instanceId, 'chats', params] as const,
  instanceGroups: (instanceId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'groups'] as const
      : ['instances', instanceId, 'groups', params] as const,
  instanceGroupLists: (instanceId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'group-lists'] as const
      : ['instances', instanceId, 'group-lists', params] as const,
  groupList: (instanceId: string, groupListId: string) => ['instances', instanceId, 'group-lists', groupListId] as const,
  groupListEntries: (instanceId: string, groupListId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'group-lists', groupListId, 'groups'] as const
      : ['instances', instanceId, 'group-lists', groupListId, 'groups', params] as const,
  groupListAudit: (instanceId: string, groupListId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'group-lists', groupListId, 'audit'] as const
      : ['instances', instanceId, 'group-lists', groupListId, 'audit', params] as const,
  groupEligibility: (instanceId: string, groupJids: readonly string[]) =>
    ['instances', instanceId, 'group-list-eligibility', { groupJids }] as const,
  groupListEligibility: (instanceId: string, groupListId: string, expectedVersion?: number) =>
    ['instances', instanceId, 'group-lists', groupListId, 'eligibility', { expectedVersion }] as const,
  group: (instanceId: string, groupId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'group', groupId] as const
      : ['instances', instanceId, 'group', groupId, params] as const,
  groupSummary: (instanceId: string) => ['instances', instanceId, 'groups', 'summary'] as const,
  groupMembers: (instanceId: string, groupId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'group', groupId, 'members'] as const
      : ['instances', instanceId, 'group', groupId, 'members', params] as const,
  groupAudit: (instanceId: string, groupId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'group', groupId, 'audit'] as const
      : ['instances', instanceId, 'group', groupId, 'audit', params] as const,
  mediaAsset: (instanceId: string, mediaId: string) => ['instances', instanceId, 'media-assets', mediaId] as const,
  mediaAssetContent: (instanceId: string, mediaId: string) => ['instances', instanceId, 'media-assets', mediaId, 'content'] as const,
  chat: (instanceId: string, chatId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'chat', chatId] as const
      : ['instances', instanceId, 'chat', chatId, params] as const,
  instanceMessages: (instanceId: string, chatId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'chat', chatId, 'messages'] as const
      : ['instances', instanceId, 'chat', chatId, 'messages', params] as const,
  message: (instanceId: string, messageId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'message', messageId] as const
      : ['instances', instanceId, 'message', messageId, params] as const,
  messageDeliveryHistory: (instanceId: string, messageId: string) =>
    ['instances', instanceId, 'message', messageId, 'delivery-history'] as const,
  instanceContacts: (instanceId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'contacts'] as const
      : ['instances', instanceId, 'contacts', params] as const,
  contact: (instanceId: string, contactId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'contact', contactId] as const
      : ['instances', instanceId, 'contact', contactId, params] as const,
  instanceLabels: (instanceId: string) => ['instances', instanceId, 'labels'] as const,
  label: (instanceId: string, labelId: string) => ['instances', instanceId, 'label', labelId] as const,
  instanceCampaigns: (instanceId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'campaigns'] as const
      : ['instances', instanceId, 'campaigns', params] as const,
  campaign: (instanceId: string, campaignId: string) => ['instances', instanceId, 'campaigns', campaignId] as const,
  campaignRecipients: (instanceId: string, campaignId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'campaigns', campaignId, 'recipients'] as const
      : ['instances', instanceId, 'campaigns', campaignId, 'recipients', params] as const,
  campaignAudit: (instanceId: string, campaignId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'campaigns', campaignId, 'audit'] as const
      : ['instances', instanceId, 'campaigns', campaignId, 'audit', params] as const,
  instanceEvents: (instanceId: string, params?: Record<string, unknown>) =>
    params === undefined
      ? ['instances', instanceId, 'events'] as const
      : ['instances', instanceId, 'events', params] as const,
  groupInvite: (instanceId: string, groupId: string) =>
    ['instances', instanceId, 'group', groupId, 'invite-link'] as const,
};

export const instanceKeys = {
  root: ['instances'] as const,
};
