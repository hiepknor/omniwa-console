import { describe, expect, it } from 'vitest';
import { authenticatedRoutes as legacyRoutes } from './generation-legacy';
import { authenticatedRoutes as v2Routes } from './generation-v2';

const paths = (routes: typeof v2Routes) => routes.map((route) => route.path);

describe('build generation route manifests', () => {
  it('keeps v2 limited to contract-owned product routes', () => {
    expect(paths(v2Routes)).toEqual(['/chats', '/chats/:chatId', '/groups', '/groups/:groupId', '/messages', '/messages/new', '/messages/:campaignId', '/overview', '/recovery', '/instances', '/instances/:instanceId', '/events', '*']);
    expect(paths(v2Routes)).not.toEqual(expect.arrayContaining(['/queue', '/webhooks', '/settings', '/settings/api-keys']));
  });

  it('keeps reviewed rollback routes in only the legacy manifest', () => {
    expect(paths(legacyRoutes)).toEqual(expect.arrayContaining(['/queue', '/webhooks', '/settings', '/settings/api-keys']));
  });
});
