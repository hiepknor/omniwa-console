import { describe, expect, it } from 'vitest';
import { conversationRouteState, setConversationParam } from './route-state';

describe('Conversations v2 route state', () => {
  it('preserves opaque cursors and normalizes unknown views', () => {
    expect(conversationRouteState(new URLSearchParams('view=unknown&cursor=opaque%3A1&messageCursor=opaque%3A2'))).toEqual({
      view: 'chats', search: '', cursor: 'opaque:1', messageCursor: 'opaque:2', selected: undefined, message: undefined,
    });
  });

  it('sets and removes one parameter without decoding other state', () => {
    const source = new URLSearchParams('view=contacts&cursor=opaque%3A1');
    expect(setConversationParam(source, 'search', 'mai').toString()).toBe('view=contacts&cursor=opaque%3A1&search=mai');
    expect(setConversationParam(source, 'cursor').toString()).toBe('view=contacts');
  });
});
