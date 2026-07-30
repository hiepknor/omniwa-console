import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ContactResource } from '@/api/contacts';
import type { ConversationResource } from '@/api/conversations';
import { ContactList, ConversationFacts, ConversationUnreadCount } from './ConversationsView';

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

describe('ConversationFacts', () => {
  it('renders projected identity and state without exposing provider aliases', () => {
    const conversation: ConversationResource = {
      resourceType: 'conversation',
      conversationId: '4c2a5707-95f6-4565-87db-20d983bbd555',
      contactId: '9c37e2c7-875c-48ff-a298-00b853409cb1',
      aliases: ['15551230001@s.whatsapp.net', '731002@lid'],
      aliasesReported: true,
      addressingJid: '731002@lid',
      type: 'direct',
      displayNameSource: 'full_name',
      unreadCount: 2,
      archived: false,
      pinned: true,
      disappearingTimer: 86_400,
    };

    const html = renderToStaticMarkup(<ConversationFacts conversation={conversation} />);

    expect(html).toContain('Conversation facts');
    expect(html).toContain('Full name');
    expect(html).toContain('Available');
    expect(html).toContain('2 reported');
    expect(html).toContain('86,400s');
    expect(html).not.toContain('731002@lid');
    expect(html).not.toContain('15551230001@s.whatsapp.net');
  });
});
