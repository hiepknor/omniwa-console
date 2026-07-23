import { describe, expect, it } from 'vitest';
import { eventRouteState, setEventParam } from './route-state';

describe('Events v2 route state', () => {
  it('preserves opaque cursor and selected event', () => {
    expect(eventRouteState(new URLSearchParams('type=Receipt&cursor=a%2Fb&event=event%3A1'))).toEqual({ type: 'Receipt', cursor: 'a/b', event: 'event:1' });
  });

  it('clears cursor and selection when exact type changes', () => {
    const source = new URLSearchParams('cursor=opaque&event=event-1');
    expect(setEventParam(source, 'type', 'Message').toString()).toBe('type=Message');
  });
});
