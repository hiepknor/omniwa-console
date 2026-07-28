import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ConversationUnreadCount } from './ConversationsView';

describe('ConversationUnreadCount', () => {
  it('omits a zero count from dense directory rows', () => {
    expect(renderToStaticMarkup(<ConversationUnreadCount count={0} context="directory" />)).toBe('');
  });

  it('uses the canonical accessible count badge for unread directory items', () => {
    const html = renderToStaticMarkup(<ConversationUnreadCount count={1_284} context="directory" />);

    expect(html).toContain('aria-label="1,284 unread messages"');
    expect(html).toContain('title="1,284 unread messages"');
    expect(html).toContain('>1,284</span>');
  });

  it('keeps the unread label and zero count explicit in detail facts', () => {
    const html = renderToStaticMarkup(<ConversationUnreadCount count={0} context="detail" />);

    expect(html).toContain('<span>Unread</span>');
    expect(html).toContain('>0</span>');
  });
});
