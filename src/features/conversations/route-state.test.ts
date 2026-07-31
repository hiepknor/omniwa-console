import { describe, expect, it } from 'vitest';
import { conversationRouteState, legacyDirectoryTarget, setConversationParam } from './route-state';

describe('Conversations route state', () => {
  it('preserves opaque Conversation and Message cursors', () => {
    expect(conversationRouteState(new URLSearchParams('cursor=opaque%3A1&messageCursor=opaque%3A2&details=unknown'))).toEqual({
      search: '', cursor: 'opaque:1', messageCursor: 'opaque:2', message: undefined, details: undefined,
    });
  });

  it('keeps the canonical conversation drawer state URL-addressable', () => {
    expect(conversationRouteState(new URLSearchParams('details=conversation')).details).toBe('conversation');
  });

  it('sets and removes one parameter without decoding other state', () => {
    const source = new URLSearchParams('cursor=opaque%3A1');
    expect(setConversationParam(source, 'search', 'mai').toString()).toBe('cursor=opaque%3A1&search=mai');
    expect(setConversationParam(source, 'cursor').toString()).toBe('');
  });

  it('normalizes legacy directory URLs without preserving unrelated Conversation state', () => {
    expect(legacyDirectoryTarget(new URLSearchParams('view=contacts&selected=contact-1&search=mai&cursor=opaque%3A1&message=m1'))).toBe('/directory/contacts/contact-1?search=mai&cursor=opaque%3A1');
    expect(legacyDirectoryTarget(new URLSearchParams('view=labels&selected=label-1&cursor=old'))).toBe('/directory/labels/label-1');
    expect(legacyDirectoryTarget(new URLSearchParams('view=unknown'))).toBeUndefined();
  });
});
