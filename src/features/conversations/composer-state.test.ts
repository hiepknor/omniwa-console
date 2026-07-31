import { describe, expect, it } from 'vitest';
import { composerNavigationBlock, IDLE_COMPOSER_STATE, resolveComposerBlocker, shouldBlockConversationNavigation } from './composer-state';

describe('composerNavigationBlock', () => {
  it('allows navigation only from a clean idle Composer', () => {
    expect(composerNavigationBlock(IDLE_COMPOSER_STATE)).toBeUndefined();
    expect(composerNavigationBlock({ ...IDLE_COMPOSER_STATE, dirty: true })).toBe('dirty');
  });

  it('prioritizes in-flight and unknown outcomes over discardable draft state', () => {
    expect(composerNavigationBlock({ dirty: true, pending: true, unknownOutcome: false })).toBe('pending');
    expect(composerNavigationBlock({ dirty: true, pending: false, unknownOutcome: true })).toBe('unknown_outcome');
    expect(composerNavigationBlock({ dirty: true, pending: true, unknownOutcome: true })).toBe('pending');
  });
});

describe('resolveComposerBlocker', () => {
  it('shows the exact unsafe reason while a navigation is blocked', () => {
    expect(resolveComposerBlocker('blocked', { ...IDLE_COMPOSER_STATE, pending: true })).toEqual({ action: 'show', reason: 'pending' });
    expect(resolveComposerBlocker('blocked', { ...IDLE_COMPOSER_STATE, unknownOutcome: true })).toEqual({ action: 'show', reason: 'unknown_outcome' });
  });

  it('resets a delayed navigation block once the Composer becomes clean', () => {
    expect(resolveComposerBlocker('blocked', IDLE_COMPOSER_STATE)).toEqual({ action: 'reset' });
    expect(resolveComposerBlocker('unblocked', IDLE_COMPOSER_STATE)).toEqual({ action: 'none' });
  });
});

describe('shouldBlockConversationNavigation', () => {
  const dirty = { ...IDLE_COMPOSER_STATE, dirty: true };

  it('blocks row, Back, browser-history, and cross-route navigation while dirty', () => {
    expect(shouldBlockConversationNavigation({ currentPath: '/conversations/conversation-1', nextPath: '/conversations/conversation-2', canonicalConversationId: 'conversation-1', state: dirty })).toBe(true);
    expect(shouldBlockConversationNavigation({ currentPath: '/conversations/conversation-1', nextPath: '/conversations', canonicalConversationId: 'conversation-1', state: dirty })).toBe(true);
    expect(shouldBlockConversationNavigation({ currentPath: '/conversations/conversation-1', nextPath: '/overview', canonicalConversationId: 'conversation-1', state: dirty })).toBe(true);
  });

  it('allows URL-only state changes and canonical alias normalization for the same entity', () => {
    expect(shouldBlockConversationNavigation({ currentPath: '/conversations/conversation-1', nextPath: '/conversations/conversation-1', canonicalConversationId: 'conversation-1', state: dirty })).toBe(false);
    expect(shouldBlockConversationNavigation({ currentPath: '/conversations/absorbed-provider-id', nextPath: '/conversations/conversation-1', canonicalConversationId: 'conversation-1', state: dirty })).toBe(false);
  });
});
