import type { PublicData } from '../envelopes';
import {
  mockActionRequired,
  mockApiKeys,
  mockAuditRecords,
  mockChats,
  mockContacts,
  mockEvents,
  mockGroupMembers,
  mockGroups,
  mockInstances,
  mockJobs,
  mockLabels,
  mockMessages,
  mockSingletons,
  mockWebhookDeliveries,
  mockWebhooks,
} from './fixtures';

type MockFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

let requestSequence = 0;

function meta() {
  requestSequence += 1;
  return {
    requestId: `mock_request_${String(requestSequence).padStart(4, '0')}`,
    correlationId: `mock_correlation_${String(requestSequence).padStart(4, '0')}`,
    timestamp: new Date().toISOString(),
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'x-omniwa-mock': 'true' },
  });
}

function single(data: PublicData, status = 200) {
  return json({ data, meta: meta() }, status);
}

function collection(data: readonly PublicData[]) {
  return json({
    data,
    meta: {
      ...meta(),
      pagination: { nextCursor: null, previousCursor: null, hasMore: false, limit: 100 },
    },
  });
}

function notFound(pathname: string) {
  return json({
    error: {
      code: 'mock_not_found',
      message: `No mock resource matches ${pathname}`,
      details: { category: 'not_found', retryable: false },
    },
    meta: meta(),
  }, 404);
}

function operation(resourceId: string | undefined, resourceType = 'operation') {
  return single({
    resourceType,
    ...(resourceId ? { resourceId } : {}),
    operationStatus: 'accepted',
    accepted: true,
    retryable: true,
    async: true,
    resultRef: resourceId ?? 'mock_operation',
  }, 202);
}

function decodedMatch(pathname: string, pattern: RegExp): string | undefined {
  const value = pathname.match(pattern)?.[1];
  return value ? decodeURIComponent(value) : undefined;
}

function findById(items: readonly PublicData[], id: string | undefined) {
  return items.find((item) => 'id' in item && item.id === id);
}

function messageDeliveryHistory(messageId: string): PublicData {
  // The public contract currently exposes history through the generic PublicData
  // envelope. Keep this flexible record quarantined at the API boundary.
  return {
    resourceType: 'messageDeliveryHistory',
    operationStatus: 'completed',
    accepted: true,
    retryable: messageId.includes('failed'),
    history: messageId.includes('failed')
      ? [
          { status: 'accepted', timestamp: '2026-07-20T08:18:00.000Z' },
          { status: 'queued', timestamp: '2026-07-20T08:18:01.000Z' },
          { status: 'dispatch retried', timestamp: '2026-07-20T08:18:30.000Z', detail: 'provider timeout', retryable: true },
          { status: 'dispatch failed', timestamp: '2026-07-20T08:19:10.000Z', detail: 'provider_error', retryable: true },
        ]
      : [
          { status: 'accepted', timestamp: '2026-07-20T08:14:00.000Z' },
          { status: 'queued', timestamp: '2026-07-20T08:14:01.000Z' },
          { status: 'delivered', timestamp: '2026-07-20T08:14:04.000Z' },
        ],
  } as unknown as PublicData;
}

function webhookDeliveryHistory(deliveryId: string): PublicData {
  // See messageDeliveryHistory: history is intentionally narrowed only here.
  return {
    resourceType: 'webhookDeliveryHistory',
    operationStatus: 'completed',
    accepted: true,
    retryable: deliveryId.includes('failed'),
    history: deliveryId.includes('failed')
      ? [
          { status: 'dispatch attempted', timestamp: '2026-07-20T08:19:12.000Z' },
          { status: 'dispatch failed', timestamp: '2026-07-20T08:24:00.000Z', detail: 'endpoint timeout', retryable: true },
        ]
      : [{ status: 'delivered', timestamp: '2026-07-20T08:14:06.000Z' }],
  } as unknown as PublicData;
}

function apiKeyOperation(resourceId: string) {
  const apiKey = findById(mockApiKeys, resourceId) ?? mockApiKeys[0];
  if (!apiKey) return operation(resourceId, 'apiKey');
  return single({
    resourceType: 'apiKey',
    resourceId,
    operationStatus: 'completed',
    accepted: true,
    async: false,
    apiKey,
  } as unknown as PublicData);
}

export const mockFetch: MockFetch = async (input, init) => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method.toUpperCase();

  await new Promise((resolve) => setTimeout(resolve, 80));

  if (method === 'GET') {
    if (pathname === '/v1/health') return single(mockSingletons.health);
    if (pathname === '/v1/health/readiness') return single(mockSingletons.readiness);
    if (pathname === '/v1/dashboard') return single(mockSingletons.dashboard);
    if (pathname === '/v1/queue' || pathname === '/v1/metrics/queue') return single(mockSingletons.queue);
    if (pathname === '/v1/metrics/messages') return single(mockSingletons.messages);
    if (pathname === '/v1/metrics/webhooks') return single(mockSingletons.webhooks);
    if (pathname === '/v1/metrics/media') return single(mockSingletons.media);
    if (pathname === '/v1/settings') return single(mockSingletons.settings);
    if (pathname === '/v1/provider/capabilities') return single(mockSingletons.provider);
    if (pathname === '/v1/action-required') return collection(mockActionRequired);
    if (pathname === '/v1/instances') return collection(mockInstances);
    if (pathname === '/v1/jobs') return collection(mockJobs);
    if (pathname === '/v1/webhooks') return collection(mockWebhooks);
    if (pathname === '/v1/webhook-deliveries') return collection(mockWebhookDeliveries);
    if (pathname === '/v1/events') return collection(mockEvents);
    if (pathname === '/v1/audit-records') return collection(mockAuditRecords);
    if (pathname === '/v1/api-keys') return collection(mockApiKeys);

    const instanceChatsId = decodedMatch(pathname, /^\/v1\/instances\/([^/]+)\/chats$/u);
    if (instanceChatsId) return collection(mockChats.filter((item) => 'instanceId' in item && item.instanceId === instanceChatsId));
    const instanceMessagesId = decodedMatch(pathname, /^\/v1\/instances\/([^/]+)\/messages$/u);
    if (instanceMessagesId) return collection(mockMessages.filter((item) => 'instanceId' in item && item.instanceId === instanceMessagesId));
    const instanceContactsId = decodedMatch(pathname, /^\/v1\/instances\/([^/]+)\/contacts$/u);
    if (instanceContactsId) return collection(mockContacts.filter((item) => 'instanceId' in item && item.instanceId === instanceContactsId));
    const instanceLabelsId = decodedMatch(pathname, /^\/v1\/instances\/([^/]+)\/labels$/u);
    if (instanceLabelsId) return collection(mockLabels.filter((item) => 'instanceId' in item && item.instanceId === instanceLabelsId));
    const instanceGroupsId = decodedMatch(pathname, /^\/v1\/instances\/([^/]+)\/groups$/u);
    if (instanceGroupsId) return collection(mockGroups.filter((item) => 'instanceId' in item && item.instanceId === instanceGroupsId));
    const sessionInstanceId = decodedMatch(pathname, /^\/v1\/instances\/([^/]+)\/sessions$/u);
    if (sessionInstanceId) return collection(sessionInstanceId === mockSingletons.session.instanceId ? [mockSingletons.session] : []);

    const groupIdForMembers = decodedMatch(pathname, /^\/v1\/groups\/([^/]+)\/members$/u);
    if (groupIdForMembers) return collection(mockGroupMembers.filter((item) => 'groupId' in item && item.groupId === groupIdForMembers));

    const messageHistoryId = decodedMatch(pathname, /^\/v1\/messages\/([^/]+)\/delivery-history$/u);
    if (messageHistoryId) return single(messageDeliveryHistory(messageHistoryId));
    const webhookHistoryId = decodedMatch(pathname, /^\/v1\/webhook-deliveries\/([^/]+)\/history$/u);
    if (webhookHistoryId) return single(webhookDeliveryHistory(webhookHistoryId));

    const resources: Array<[RegExp, readonly PublicData[]]> = [
      [/^\/v1\/instances\/([^/]+)$/u, mockInstances],
      [/^\/v1\/chats\/([^/]+)$/u, mockChats],
      [/^\/v1\/messages\/([^/]+)$/u, mockMessages],
      [/^\/v1\/contacts\/([^/]+)$/u, mockContacts],
      [/^\/v1\/labels\/([^/]+)$/u, mockLabels],
      [/^\/v1\/groups\/([^/]+)$/u, mockGroups],
      [/^\/v1\/jobs\/([^/]+)$/u, mockJobs],
      [/^\/v1\/webhooks\/([^/]+)$/u, mockWebhooks],
      [/^\/v1\/media\/([^/]+)$/u, [mockSingletons.mediaResource]],
    ];
    for (const [pattern, items] of resources) {
      const id = decodedMatch(pathname, pattern);
      if (!id) continue;
      const item = findById(items, id);
      return item ? single(item) : notFound(pathname);
    }
    return notFound(pathname);
  }

  const apiKeyId = decodedMatch(pathname, /^\/v1\/api-keys\/([^/]+)\/(?:rotate|revoke)$/u);
  if (pathname === '/v1/api-keys' || apiKeyId) return apiKeyOperation(apiKeyId ?? 'key_mock_new_04');

  const segments = pathname.split('/').filter(Boolean);
  const resourceId = segments.find((segment) => /^(?:inst|grp|msg|wh|whd|key|med)_/u.test(segment));
  return operation(resourceId);
};
