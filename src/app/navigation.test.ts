import { describe, expect, it } from 'vitest';
import { navigationForKeyKind, pinnedNavigationForKeyKind } from './navigation';

describe('scope navigation', () => {
  it('makes connection and pairing reachable for an instance credential', () => {
    const items = navigationForKeyKind('api').flatMap((section) => section.items);
    const routes = items.map((item) => item.to);
    expect(routes).not.toContain('/connection');
    expect(routes).toContain('/campaigns');
    expect(routes).not.toContain('/instances');
    expect(routes).not.toContain('/messages');
    expect(routes).toContain('/conversations');
    expect(routes).toContain('/directory');
    expect(pinnedNavigationForKeyKind('api')).toEqual({ to: '/connection', label: 'Connection', icon: 'connection', end: true });
    expect(items.find((item) => item.to === '/campaigns')?.label).toBe('Campaigns');
  });

  it('keeps fleet management in admin scope', () => {
    const routes = navigationForKeyKind('admin').flatMap((section) => section.items.map((item) => item.to));
    expect(routes).toContain('/instances');
    expect(routes).not.toContain('/connection');
    expect(routes).not.toContain('/directory');
    expect(pinnedNavigationForKeyKind('admin')).toBeUndefined();
  });
});
