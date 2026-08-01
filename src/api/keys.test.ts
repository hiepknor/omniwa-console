import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { queryKeys, SESSION_QUERY_SCOPE } from './keys';

describe('query key ownership', () => {
  it('uses an explicit non-secret scope for session-scoped projections', () => {
    expect(SESSION_QUERY_SCOPE).toBe('session');
    expect(queryKeys.instanceConversations(SESSION_QUERY_SCOPE)).toEqual([
      'instances',
      'session',
      'conversations',
      'list',
    ]);
  });

  it('keeps list roots free of synthetic parameter objects', () => {
    expect(queryKeys.instanceConversations('instance-1')).toEqual(['instances', 'instance-1', 'conversations', 'list']);
    expect(queryKeys.conversationMessages('instance-1', 'conversation-1')).toEqual([
      'instances',
      'instance-1',
      'conversations',
      'conversation-1',
      'messages',
    ]);
    expect(queryKeys.instanceCampaigns('instance-1')).toEqual([
      'instances',
      'instance-1',
      'campaigns',
    ]);
    expect(queryKeys.instanceEvents('instance-1')).toEqual(['instances', 'instance-1', 'events']);
    expect(queryKeys.instanceContacts('instance-1')).toEqual(['instances', 'instance-1', 'contacts']);
    expect(queryKeys.instanceContacts('instance-2')).not.toEqual(queryKeys.instanceContacts('instance-1'));
  });

  it('appends normalized read parameters only to concrete cache entries', () => {
    expect(queryKeys.instanceConversations('instance-1', { cursor: 'opaque' })).toEqual([
      'instances',
      'instance-1',
      'conversations',
      'list',
      { cursor: 'opaque' },
    ]);
    expect(queryKeys.campaignRecipients('instance-1', 'campaign-1', { cursor: 'opaque' })).toEqual([
      'instances',
      'instance-1',
      'campaigns',
      'campaign-1',
      'recipients',
      { cursor: 'opaque' },
    ]);
    expect(queryKeys.conversation('instance-1', 'conversation-1')).toEqual([
      'instances', 'instance-1', 'conversations', 'conversation-1',
    ]);
    expect(queryKeys.conversationMessages('instance-1', 'conversation-1', { cursor: undefined })).toEqual([
      'instances', 'instance-1', 'conversations', 'conversation-1', 'messages', { cursor: undefined },
    ]);
  });

  it('invalidates every parameterized page below a resource root without crossing scope', async () => {
    const cache = new QueryClient();
    const firstPage = queryKeys.instanceCampaigns('instance-1', { status: 'draft', cursor: undefined });
    const nextPage = queryKeys.instanceCampaigns('instance-1', { status: 'draft', cursor: 'opaque' });
    const otherInstance = queryKeys.instanceCampaigns('instance-2', { status: 'draft' });

    cache.setQueryData(firstPage, ['first']);
    cache.setQueryData(nextPage, ['next']);
    cache.setQueryData(otherInstance, ['other']);

    await cache.invalidateQueries({
      queryKey: queryKeys.instanceCampaigns('instance-1'),
      refetchType: 'none',
    });

    expect(cache.getQueryState(firstPage)?.isInvalidated).toBe(true);
    expect(cache.getQueryState(nextPage)?.isInvalidated).toBe(true);
    expect(cache.getQueryState(otherInstance)?.isInvalidated).toBe(false);
  });

  it('keeps conversation list invalidation separate from detail and message history', async () => {
    const cache = new QueryClient();
    const list = queryKeys.instanceConversations('instance-1', { cursor: undefined });
    const detail = queryKeys.conversation('instance-1', 'conversation-1');
    const messages = queryKeys.conversationMessages('instance-1', 'conversation-1', { cursor: undefined });
    cache.setQueryData(list, ['list']);
    cache.setQueryData(detail, ['detail']);
    cache.setQueryData(messages, ['messages']);

    await cache.invalidateQueries({ queryKey: queryKeys.instanceConversations('instance-1'), refetchType: 'none' });

    expect(cache.getQueryState(list)?.isInvalidated).toBe(true);
    expect(cache.getQueryState(detail)?.isInvalidated).toBe(false);
    expect(cache.getQueryState(messages)?.isInvalidated).toBe(false);
  });

  it('provides canonical roots for recovery and invite-link refreshes', () => {
    expect(queryKeys.projectionFailuresRoot).toEqual(['projection-failures']);
    expect(queryKeys.groupInvite('instance-1', 'group-1')).toEqual([
      'instances',
      'instance-1',
      'group',
      'group-1',
      'invite-link',
    ]);
    expect(queryKeys.instanceMetadata('instance-1', true)).toEqual([
      'instances',
      'instance-1',
      { metadata: true },
    ]);
    expect(queryKeys.instanceStatus('instance-1')).toEqual(['instances', 'instance-1', 'status']);
    expect(queryKeys.instanceQr('instance-1')).toEqual(['instances', 'instance-1', 'qr']);
    expect(queryKeys.instanceAdvancedSettings('instance-1')).toEqual([
      'instances',
      'instance-1',
      'advanced-settings',
    ]);
  });
});
