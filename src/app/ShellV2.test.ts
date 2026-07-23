import { describe, expect, it } from 'vitest';
import { navigationForKeyKind, scopeLabelForKeyKind } from './ShellV2';

const pathsFor = (kind: Parameters<typeof navigationForKeyKind>[0]) =>
  navigationForKeyKind(kind).flatMap((section) => section.items.map((item) => item.to));

describe('navigationForKeyKind', () => {
  it('limits an admin credential to platform-owned panels', () => {
    expect(pathsFor('admin')).toEqual(['/overview', '/instances']);
  });

  it('shows contract-backed instance operations for an API credential', () => {
    expect(pathsFor('api')).toEqual(['/overview', '/chats', '/groups', '/messages', '/events']);
  });

  it('does not advertise deferred legacy panels', () => {
    for (const kind of ['admin', 'api', 'unknown'] as const) {
      expect(pathsFor(kind)).not.toEqual(expect.arrayContaining(['/queue', '/webhooks', '/settings', '/settings/api-keys']));
    }
  });

  it('labels every credential scope without treating unknown as instance', () => {
    expect(scopeLabelForKeyKind('admin')).toBe('Admin scope');
    expect(scopeLabelForKeyKind('api')).toBe('Instance scope');
    expect(scopeLabelForKeyKind('unknown')).toBe('Unknown scope');
  });
});
