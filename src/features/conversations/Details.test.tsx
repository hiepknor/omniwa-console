import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
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
  archived: false,
  pinned: true,
  disappearingTimer: 86_400,
  lastMessageId: 'message-1',
  lastMessageAt: '2026-07-30T07:10:00Z',
  lastActivityAt: '2026-07-30T07:11:00Z',
};

describe('ConversationDetailsContent', () => {
  it('organizes canonical identity, provider routing, and projected state in shared panels', () => {
    const html = renderToStaticMarkup(<ConversationDetailsContent conversation={conversation} />);

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
  });

  it('keeps missing optional provider and state fields unreported', () => {
    const html = renderToStaticMarkup(<ConversationDetailsContent conversation={{ ...conversation, aliases: [], aliasesReported: false, addressingJid: undefined, archived: undefined }} />);

    expect(html).toContain('Unreported');
    expect(html).toContain('Not reported');
    expect(html).not.toContain('>0</dd>');
  });
});
