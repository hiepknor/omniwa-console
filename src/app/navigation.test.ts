import { describe, expect, it } from 'vitest';
import { navigationForKeyKind } from './navigation';

describe('scope navigation', () => {
  it('makes connection and pairing reachable for an instance credential', () => {
    const items = navigationForKeyKind('api').flatMap((section) => section.items);
    const routes = items.map((item) => item.to);
    expect(routes).toContain('/connection');
    expect(routes).not.toContain('/instances');
    expect(items.find((item) => item.to === '/connection')?.label).toBe('Instance');
  });

  it('keeps fleet management in admin scope', () => {
    const routes = navigationForKeyKind('admin').flatMap((section) => section.items.map((item) => item.to));
    expect(routes).toContain('/instances');
    expect(routes).not.toContain('/connection');
  });
});
