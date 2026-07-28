import { describe, expect, it } from 'vitest';
import { NavigationType } from 'react-router-dom';
import { horizontalRevealScrollLeft, mainScrollScope, scrollTopForNavigation } from './scroll-behavior';

describe('shell scroll behavior', () => {
  it('keeps list and detail routes in one scope while excluding overlay state', () => {
    expect(mainScrollScope('/groups/group_01', '?search=ops&tab=members&create=1')).toBe('/groups?search=ops');
    expect(mainScrollScope('/groups/lists/list_01', '?search=ops&tab=audit')).toBe('/groups/lists?search=ops');
    expect(mainScrollScope('/events', '?type=message&event=event_01&cursor=opaque')).toBe('/events?type=message&cursor=opaque');
    expect(mainScrollScope('/chats/chat_01', '?view=chats&cursor=opaque&messageCursor=older&message=msg_01')).toBe('/chats?view=chats&cursor=opaque');
  });

  it('treats filters, cursors, and editor routes as new reading contexts', () => {
    expect(mainScrollScope('/groups', '?search=alpha')).not.toBe(mainScrollScope('/groups', '?search=beta'));
    expect(mainScrollScope('/groups', '')).not.toBe(mainScrollScope('/groups/lists', ''));
    expect(mainScrollScope('/campaigns/new', '')).toBe('/campaigns/new');
    expect(mainScrollScope('/groups/lists/new', '')).toBe('/groups/lists/new');
    expect(mainScrollScope('/groups/lists/list_01/edit', '')).toBe('/groups/lists/list_01/edit');
  });

  it('restores browser history and otherwise resets only when the scope changes', () => {
    expect(scrollTopForNavigation({ navigationType: NavigationType.Pop, previousScope: '/events', nextScope: '/groups', currentTop: 12, savedTop: 480 })).toBe(480);
    expect(scrollTopForNavigation({ navigationType: NavigationType.Push, previousScope: '/groups', nextScope: '/groups', currentTop: 320 })).toBe(320);
    expect(scrollTopForNavigation({ navigationType: NavigationType.Replace, previousScope: '/groups?cursor=one', nextScope: '/groups?cursor=two', currentTop: 320 })).toBe(0);
  });

  it('reveals an active mobile navigation item by moving only its horizontal scroller', () => {
    expect(horizontalRevealScrollLeft(72, { left: 0, right: 390 }, { left: 360, right: 432 })).toBe(114);
    expect(horizontalRevealScrollLeft(72, { left: 0, right: 390 }, { left: 144, right: 216 })).toBe(72);
    expect(horizontalRevealScrollLeft(72, { left: 16, right: 390 }, { left: -20, right: 52 })).toBe(36);
  });
});
