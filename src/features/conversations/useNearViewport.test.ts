import { describe, expect, it } from 'vitest';
import { shouldLoadConversationMedia } from './useNearViewport';

describe('conversation media visibility policy', () => {
  it('does not read offscreen timeline media', () => {
    expect(shouldLoadConversationMedia(true, true, false, false)).toBe(false);
  });

  it('reads near-viewport media and priority inspector media', () => {
    expect(shouldLoadConversationMedia(true, true, true, false)).toBe(true);
    expect(shouldLoadConversationMedia(true, true, false, true)).toBe(true);
  });

  it('never reads media without the unified capability or asset ID', () => {
    expect(shouldLoadConversationMedia(false, true, true, true)).toBe(false);
    expect(shouldLoadConversationMedia(true, false, true, true)).toBe(false);
  });
});
