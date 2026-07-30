import { describe, expect, it } from 'vitest';
import { matchRoutes } from 'react-router-dom';
import { authenticatedRoutes } from './App';

describe('authenticated route manifest', () => {
  it('owns campaigns under the canonical campaigns namespace only', () => {
    const paths = authenticatedRoutes.flatMap((route) => route.path ?? []);

    expect(paths).toEqual(expect.arrayContaining([
      '/campaigns',
      '/campaigns/new',
      '/campaigns/:campaignId',
    ]));
    expect(paths.some((path) => path === '/messages' || path.startsWith('/messages/'))).toBe(false);
  });

  it('owns canonical conversation routes', () => {
    const paths = authenticatedRoutes.flatMap((route) => route.path ?? []);
    expect(paths).toEqual(expect.arrayContaining(['/conversations', '/conversations/:conversationRef']));
  });

  it.each([
    ['/groups/lists', '/groups/lists'],
    ['/groups/lists/new', '/groups/lists/new'],
    ['/groups/lists/list-1', '/groups/lists/:groupListId'],
    ['/groups/lists/list-1/edit', '/groups/lists/:groupListId/edit'],
    ['/campaigns', '/campaigns'],
    ['/campaigns/new', '/campaigns/new'],
    ['/campaigns/campaign-1', '/campaigns/:campaignId'],
    ['/conversations', '/conversations'],
    ['/conversations/conversation-1', '/conversations/:conversationRef'],
    ['/chats', '*'],
    ['/chats/provider-chat-id', '*'],
    ['/messages', '*'],
    ['/messages/campaign-1', '*'],
  ])('matches %s to %s', (location, expectedPath) => {
    expect(matchRoutes(authenticatedRoutes, location)?.at(-1)?.route.path).toBe(expectedPath);
  });
});
