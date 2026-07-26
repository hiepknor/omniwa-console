import { describe, expect, it } from 'vitest';
import { navigationForKeyKind } from './navigation';

describe('scope navigation', () => {
  it('makes connection and pairing reachable for an instance credential', () => {
    const routes = navigationForKeyKind('api').flatMap((section) => section.items.map((item) => item.to));
    expect(routes).toContain('/connection');
    expect(routes).not.toContain('/instances');
  });

  it('keeps fleet management in admin scope', () => {
    const routes = navigationForKeyKind('admin').flatMap((section) => section.items.map((item) => item.to));
    expect(routes).toContain('/instances');
    expect(routes).not.toContain('/connection');
  });
});
