import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { MessageResource } from '@/api/messages';
import { ConversationUnreadCount, isNearScrollEnd, MessageTimeline } from './ConversationsView';

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
