import { describe, expect, it } from 'vitest';
import { matchRoutes } from 'react-router-dom';
import { authenticatedRoutes, legacyChatsRedirectLocation } from './App';

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

  it('owns canonical conversation routes and discards legacy cursor state during redirect', () => {
    const paths = authenticatedRoutes.flatMap((route) => route.path ?? []);
    expect(paths).toEqual(expect.arrayContaining(['/conversations', '/conversations/:conversationRef']));
    expect(legacyChatsRedirectLocation('123@lid', '?view=chats&cursor=legacy-list&messageCursor=legacy-messages&message=message-1')).toBe(
      '/conversations/123%40lid?message=message-1',
    );
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
    ['/messages', '*'],
    ['/messages/campaign-1', '*'],
  ])('matches %s to %s', (location, expectedPath) => {
    expect(matchRoutes(authenticatedRoutes, location)?.at(-1)?.route.path).toBe(expectedPath);
  });
});
