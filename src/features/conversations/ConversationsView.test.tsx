import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ContactResource } from '@/api/contacts';
import { ContactList, ConversationUnreadCount } from './ConversationsView';

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

describe('ContactList', () => {
  const contact = (found?: boolean): ContactResource => ({
    resourceType: 'contact',
    id: '9c37e2c7-875c-48ff-a298-00b853409cb1',
    aliases: [],
    identityStatus: 'complete',
    found,
  });

  it('distinguishes an unreported found value from an explicit negative', () => {
    const unreported = renderToStaticMarkup(<ContactList items={[contact()]} onSelect={() => {}} />);
    const notFound = renderToStaticMarkup(<ContactList items={[contact(false)]} onSelect={() => {}} />);

    expect(unreported).toContain('Unreported');
    expect(unreported).not.toContain('Not found');
    expect(notFound).toContain('Not found');
  });
});
