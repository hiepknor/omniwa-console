import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { ConversationResource } from '@/api/conversations';
import { ConversationDetailsContent } from './Details';

const conversation: ConversationResource = {
  resourceType: 'conversation',
  conversationId: '4c2a5707-95f6-4565-87db-20d983bbd555',
  contactId: '9c37e2c7-875c-48ff-a298-00b853409cb1',
  aliases: ['15551230001@s.whatsapp.net', '731002@lid'],
  aliasesReported: true,
  addressingJid: '731002@lid',
  type: 'direct',
  displayName: 'Anna Nguyen',
  displayNameSource: 'full_name',
  displayNameUpdatedAt: '2026-07-30T07:00:00Z',
  unreadCount: 2,
  unreadAuthoritative: true,
  archived: false,
  pinned: true,
  disappearingTimer: 86_400,
  lastMessageId: 'message-1',
  lastMessageAt: '2026-07-30T07:10:00Z',
  lastActivityAt: '2026-07-30T07:11:00Z',
};

function renderDetails(value: ConversationResource): string {
  return renderToStaticMarkup(<MemoryRouter><ConversationDetailsContent conversation={value} /></MemoryRouter>);
}

describe('ConversationDetailsContent', () => {
  it('organizes canonical identity, provider routing, and projected state in shared panels', () => {
    const html = renderDetails(conversation);

    expect(html).toContain('Canonical identity');
    expect(html).toContain('Provider routing');
    expect(html).toContain('Projected state');
    expect(html).toContain('731002@lid');
    expect(html).toContain('15551230001@s.whatsapp.net');
    expect(html).toContain('1 day · 86,400s');
    expect(html).toContain('>2</span>');
    expect(html).toContain('<h3');
    expect(html).toContain('aria-label="Copy Conversation ID"');
    expect(html).toContain('aria-label="Copy Provider aliases"');
    expect(html).toContain('href="/directory/contacts/9c37e2c7-875c-48ff-a298-00b853409cb1"');
  });

  it('keeps missing optional provider and state fields unreported', () => {
    const html = renderDetails({ ...conversation, aliases: [], aliasesReported: false, addressingJid: undefined, archived: undefined });

    expect(html).toContain('Unreported');
    expect(html).toContain('Not reported');
    expect(html).not.toContain('>0</dd>');
  });

  it('does not invent a Contact destination when contactId is absent', () => {
    const html = renderDetails({ ...conversation, contactId: undefined });
    expect(html).not.toContain('Open contact');
  });

  it('marks non-authoritative unread as syncing without rendering its best-known count', () => {
    const html = renderDetails({ ...conversation, unreadCount: 0, unreadAuthoritative: false });
    expect(html).toContain('Syncing');
    expect(html).not.toContain('>0</span>');
  });
});
