const ADMIN_INSTANCE_PATHS = new Set([
  '/instance/all',
  '/instance/create',
  '/instance/credential-health',
  '/instance/metadata',
  '/instance/rotate-token/{instanceId}',
]);

const INSTANCE_ADMIN_PREFIXES = [
  '/instance/delete/',
  '/instance/forcereconnect/',
  '/instance/info/',
  '/instance/logs/',
  '/instance/metadata/',
  '/instance/proxy/',
];

const CAPABILITY_RULES = [
  ['instance_metadata_views', new Set(['GET /instance/metadata', 'GET /instance/metadata/{instanceId}'])],
  ['instance_token_rotation', new Set(['POST /instance/rotate-token/{instanceId}'])],
  ['instance_credential_health', new Set(['GET /instance/credential-health'])],
  ['projection_failure_operations', new Set([
    'GET /server/projection-failures',
    'POST /server/projection-failures/discard',
    'POST /server/projection-failures/replay',
  ])],
  ['groups_projection', new Set(['GET /group/list', 'GET /group/search', 'POST /group/info'])],
  ['labels_projection', new Set(['GET /label/info/{labelId}', 'GET /label/list'])],
  ['contacts_projection', new Set([
    'GET /user/contact/{contactId}',
    'GET /user/contacts',
    'GET /user/contacts/search',
  ])],
  ['chats_projection', new Set(['GET /chat/info/{chatId}', 'GET /chat/list'])],
  ['messages_projection', new Set([
    'GET /chat/{chatId}/messages',
    'GET /message/{messageId}',
    'GET /message/{messageId}/delivery',
  ])],
  ['events_projection', new Set(['GET /events'])],
];

const REDESIGN_NOW = new Set([
  'GET /server/capabilities',
  'GET /server/health',
  'GET /server/overview',
  'GET /server/projection-health',
  'GET /server/projection-failures',
  'POST /server/projection-failures/discard',
  'POST /server/projection-failures/replay',
  'GET /events',
  'GET /instance/metadata',
  'GET /instance/metadata/{instanceId}',
  'POST /instance/create',
  'POST /instance/rotate-token/{instanceId}',
  'GET /instance/credential-health',
  'DELETE /instance/delete/{instanceId}',
  'GET /instance/status',
  'GET /instance/qr',
  'POST /instance/connect',
  'POST /instance/disconnect',
  'POST /instance/reconnect',
  'DELETE /instance/logout',
  'GET /instance/{instanceId}/advanced-settings',
  'PUT /instance/{instanceId}/advanced-settings',
  'GET /chat/list',
  'GET /chat/info/{chatId}',
  'GET /chat/{chatId}/messages',
  'GET /message/{messageId}',
  'GET /message/{messageId}/delivery',
  'GET /user/contacts',
  'GET /user/contacts/search',
  'GET /user/contact/{contactId}',
  'GET /label/list',
  'GET /label/info/{labelId}',
  'GET /group/list',
  'GET /group/search',
  'POST /group/info',
  'POST /group/create',
  'POST /group/name',
  'POST /group/description',
  'POST /group/settings',
  'POST /group/participant',
  'POST /group/invitelink',
  'POST /group/leave',
  'POST /send/text',
  'POST /send/media',
  'GET /campaigns',
  'POST /campaigns',
  'GET /campaigns/{campaignId}',
  'GET /campaigns/{campaignId}/recipients',
  'GET /campaigns/{campaignId}/audit',
  'POST /campaigns/{campaignId}/schedule',
  'POST /campaigns/{campaignId}/start',
  'POST /campaigns/{campaignId}/pause',
  'POST /campaigns/{campaignId}/resume',
  'POST /campaigns/{campaignId}/abort',
]);

const BACKEND_RISK = new Set([
  'GET /group/myall',
  'POST /chat/archive',
  'POST /chat/mute',
  'POST /chat/pin',
  'POST /chat/unarchive',
  'POST /chat/unmute',
  'POST /chat/unpin',
]);

const PROJECTION_READS = new Set([
  'GET /events',
  'GET /group/list',
  'GET /group/search',
  'POST /group/info',
  'GET /label/info/{labelId}',
  'GET /label/list',
  'GET /user/contact/{contactId}',
  'GET /user/contacts',
  'GET /user/contacts/search',
  'GET /chat/info/{chatId}',
  'GET /chat/list',
  'GET /chat/{chatId}/messages',
  'GET /message/{messageId}',
  'GET /message/{messageId}/delivery',
]);
const CONTROL_PLANE_READS = new Set([
  'GET /server/capabilities',
  'GET /server/health',
  'GET /server/overview',
  'GET /server/projection-health',
  'GET /server/projection-failures',
  'GET /instance/all',
  'GET /instance/credential-health',
  'GET /instance/info/{instanceId}',
  'GET /instance/logs/{instanceId}',
  'GET /instance/metadata',
  'GET /instance/metadata/{instanceId}',
]);

function operationCapability(operation, path) {
  for (const [capability, operations] of CAPABILITY_RULES) {
    if (operations.has(operation)) return capability;
  }
  if (path.startsWith('/campaigns')) return 'campaign_orchestration';
  if (path.startsWith('/send/')) return 'outbound_rate_limit';
  return 'none-advertised';
}

function operationScope(path) {
  if (path.startsWith('/passkey-ceremony/')) return 'public-ceremony';
  if (path.startsWith('/server/projection-failures')) return 'admin';
  if (path.startsWith('/server/')) return 'admin-or-instance';
  if (ADMIN_INSTANCE_PATHS.has(path) || INSTANCE_ADMIN_PREFIXES.some((prefix) => path.startsWith(prefix))) return 'admin';
  return 'instance';
}

function operationWorkflow(path) {
  if (path.startsWith('/server/projection-failures')) return 'projection-recovery';
  if (path.startsWith('/server/')) return 'platform-observability';
  if (path.startsWith('/instance/')) return 'instance-fleet';
  if (path.startsWith('/campaigns')) return 'campaign-delivery';
  if (path === '/events') return 'event-history';
  if (path.startsWith('/chat/') || path.startsWith('/message/') || path.startsWith('/send/') || path.startsWith('/polls/')) return 'conversations';
  if (path.startsWith('/user/') || path.startsWith('/label/')) return 'contacts-and-labels';
  if (path.startsWith('/group/') || path.startsWith('/community/')) return 'groups-and-communities';
  if (path.startsWith('/newsletter/')) return 'newsletters';
  if (path.startsWith('/call/')) return 'call-control';
  if (path.startsWith('/passkey-ceremony/')) return 'external-passkey-helper';
  if (path.startsWith('/unlabel/')) return 'contacts-and-labels';
  throw new Error(`No workflow classification for ${path}`);
}

function operationMode(method, path, operation) {
  if (PROJECTION_READS.has(operation)) return 'projection-read';
  if (CONTROL_PLANE_READS.has(operation)) return 'control-plane-read';
  if (method === 'GET' && path.startsWith('/campaigns')) return 'control-plane-read';
  if (method === 'GET' || operation === 'POST /message/status' || operation === 'POST /user/avatar' || operation === 'POST /user/check' || operation === 'POST /user/info' || operation === 'POST /newsletter/info' || operation === 'POST /newsletter/messages') return 'live-read';
  if (operation === 'POST /group/invitelink') return 'projection-read-or-command';
  return 'command';
}

function operationTarget(path, operation) {
  if (path.startsWith('/passkey-ceremony/')) return 'external-client';
  if (BACKEND_RISK.has(operation)) return 'deferred-backend-risk';
  if (REDESIGN_NOW.has(operation)) return 'redesign-v2';
  return 'deferred-product-workflow';
}

export function classifyOperation(method, path) {
  const normalizedMethod = method.toUpperCase();
  const operation = `${normalizedMethod} ${path}`;
  return {
    operation,
    scope: operationScope(path),
    capability: operationCapability(operation, path),
    mode: operationMode(normalizedMethod, path, operation),
    workflow: operationWorkflow(path),
    target: operationTarget(path, operation),
  };
}

export const allowedClassifications = {
  scope: new Set(['admin', 'admin-or-instance', 'instance', 'public-ceremony']),
  mode: new Set(['command', 'control-plane-read', 'live-read', 'projection-read', 'projection-read-or-command']),
  target: new Set(['redesign-v2', 'deferred-backend-risk', 'deferred-product-workflow', 'external-client']),
};
