import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ConversationResource } from '@/api/conversations';
import type { MessageResource } from '@/api/messages';
import { ConversationList, ConversationMessagePagination, ConversationUnreadCount, isNearScrollEnd, MessageTimeline } from './ConversationsView';

describe('ConversationUnreadCount', () => {
  it('omits a zero count from dense directory rows', () => {
    expect(renderToStaticMarkup(<ConversationUnreadCount count={0} authoritative context="directory" />)).toBe('');
  });

  it('uses the canonical accessible count badge for unread directory items', () => {
    const html = renderToStaticMarkup(<ConversationUnreadCount count={1_284} authoritative context="directory" />);

    expect(html).toContain('aria-label="1,284 unread messages"');
    expect(html).toContain('title="1,284 unread messages"');
    expect(html).toContain('>1,284</span>');
  });

  it('keeps the unread label and zero count explicit in detail facts', () => {
    const html = renderToStaticMarkup(<ConversationUnreadCount count={0} authoritative context="detail" />);

    expect(html).toContain('<span>Unread</span>');
    expect(html).toContain('>0</span>');
  });

  it('shows a syncing state without presenting a non-authoritative number as zero', () => {
    const html = renderToStaticMarkup(<ConversationUnreadCount count={0} authoritative={false} context="detail" />);
    expect(html).toContain('Unread syncing');
    expect(html).not.toContain('>0</span>');
  });
});

describe('ConversationList', () => {
  const conversation: ConversationResource = {
    resourceType: 'conversation',
    conversationId: 'conversation-1',
    aliases: [],
    aliasesReported: true,
    displayName: 'Operations',
    type: 'group',
    unreadCount: 0,
    unreadAuthoritative: true,
  };

  it('marks the canonical selected Conversation with an ink edge and current-page semantics', () => {
    const html = renderToStaticMarkup(<ConversationList items={[conversation]} selectedId="conversation-1" onSelect={() => {}} />);

    expect(html).toContain('border-l-line-strong bg-elevated');
    expect(html).toContain('aria-current="page"');
  });

  it('reserves the selection edge without exposing current-page semantics on other rows', () => {
    const html = renderToStaticMarkup(<ConversationList items={[conversation]} selectedId="conversation-2" onSelect={() => {}} />);

    expect(html).toContain('border-l-transparent');
    expect(html).not.toContain('aria-current');
  });
});

describe('ConversationMessagePagination', () => {
  it('stays anchored to the bottom for a populated bounded page', () => {
    const html = renderToStaticMarkup(<ConversationMessagePagination itemCount={1} nextCursor="older" onCursor={() => {}} />);

    expect(html).toContain('class="mt-auto"');
    expect(html).toContain('Showing one bounded message page.');
    expect(html).toContain('Older messages');
  });

  it('is hidden for a fresh empty history', () => {
    expect(renderToStaticMarkup(<ConversationMessagePagination itemCount={0} onCursor={() => {}} />)).toBe('');
  });

  it('retains the Newest recovery action for an empty cursor-addressed page', () => {
    const html = renderToStaticMarkup(<ConversationMessagePagination itemCount={0} cursor="empty-page" onCursor={() => {}} />);

    expect(html).toContain('Newest');
    expect(html).toContain('class="mt-auto"');
  });
});

describe('MessageTimeline', () => {
  const message = (overrides: Partial<MessageResource>): MessageResource => ({
    resourceType: 'message',
    id: 'message-1',
    conversationId: 'conversation-1',
    direction: 'incoming',
    type: 'text',
    createdAt: '2026-07-29T08:00:00Z',
    provenance: 'live',
    ...overrides,
  });

  it('uses one bounded reading lane with explicit direction, dates, and honest missing content', () => {
    const html = renderToStaticMarkup(
      <MessageTimeline
        items={[
          message({ id: 'incoming-empty' }),
          message({ id: 'system-1', direction: 'system', status: 'failed', contentSummary: 'Encryption state changed', createdAt: '2026-07-30T08:00:00Z' }),
        ]}
        conversationType="group"
        onSelect={() => {}}
      />,
    );

    expect(html).toContain('max-w-[min(78%,42rem)]');
    expect(html).not.toContain('max-w-[960px]');
    expect(html).toContain('Text content not reported');
    expect(html).toContain('Participant not identified');
    expect(html).toContain('Incoming · Unreported');
    expect(html).toContain('System · Failed');
    expect(html).toContain('aria-label="Incoming group message from unidentified participant: Text content not reported Status: Unreported. Time:');
    expect(html).toContain('role="separator" aria-label=');
    expect(html.match(/role="separator"/g)).toHaveLength(2);
  });

  it('keeps following new messages bounded to operators already near the end', () => {
    expect(isNearScrollEnd({ scrollHeight: 1_000, scrollTop: 420, clientHeight: 500 })).toBe(true);
    expect(isNearScrollEnd({ scrollHeight: 1_000, scrollTop: 200, clientHeight: 500 })).toBe(false);
  });
});
