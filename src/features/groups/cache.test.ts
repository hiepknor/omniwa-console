import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { queryKeys, SESSION_QUERY_SCOPE } from '@/api/keys';
import { invalidateGroupSendProjections } from './cache';

describe('invalidateGroupSendProjections', () => {
  it('refreshes chat and selected group-message pages without crossing scope', async () => {
    const client = new QueryClient();
    const groupId = '120363001@g.us';
    const chatPage = queryKeys.instanceChats(SESSION_QUERY_SCOPE, { cursor: 'chat-page' });
    const messagePage = queryKeys.instanceMessages(SESSION_QUERY_SCOPE, groupId, { cursor: 'message-page' });
    const otherMessages = queryKeys.instanceMessages(SESSION_QUERY_SCOPE, 'other@g.us', { cursor: 'other' });
    client.setQueryData(chatPage, ['chat']);
    client.setQueryData(messagePage, ['message']);
    client.setQueryData(otherMessages, ['other']);

    await invalidateGroupSendProjections(client, groupId);

    expect(client.getQueryState(chatPage)?.isInvalidated).toBe(true);
    expect(client.getQueryState(messagePage)?.isInvalidated).toBe(true);
    expect(client.getQueryState(otherMessages)?.isInvalidated).toBe(false);
  });
});
