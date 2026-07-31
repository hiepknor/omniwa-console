import type { KeyKind } from '@/lib/session';
import type { NavigationIconName } from '@/ui';

export type NavIcon = NavigationIconName;
export type NavItem = { to: string; label: string; icon: NavIcon; end?: boolean };
export type NavSection = { label: string; items: NavItem[] };

const overview = { to: '/overview', label: 'Overview', icon: 'overview', end: true } as const;
const connection = { to: '/connection', label: 'Connection', icon: 'connection', end: true } as const;

/** Navigation is derived from the session key kind, never hardcoded. */
export function navigationForKeyKind(keyKind: KeyKind, recoveryAvailable = false): NavSection[] {
  if (keyKind === 'admin') {
    return [
      {
        label: 'Platform',
        items: [
          overview,
          ...(recoveryAvailable ? [{ to: '/recovery', label: 'Recovery', icon: 'recovery' as const }] : []),
          { to: '/instances', label: 'Instances', icon: 'instances' },
        ],
      },
    ];
  }
  if (keyKind === 'api') {
    return [
      { label: 'Runtime', items: [overview] },
      {
        label: 'Messaging',
        items: [
          { to: '/conversations', label: 'Conversations', icon: 'conversations' },
          { to: '/directory', label: 'Directory', icon: 'directory' },
          { to: '/groups', label: 'Groups', icon: 'groups' },
          { to: '/campaigns', label: 'Campaigns', icon: 'campaigns' },
        ],
      },
      { label: 'Observability', items: [{ to: '/events', label: 'Events', icon: 'events' }] },
    ];
  }
  return [{ label: 'Runtime', items: [overview] }];
}

/** The active instance connection stays reachable as a pinned runtime destination. */
export function pinnedNavigationForKeyKind(keyKind: KeyKind): NavItem | undefined {
  return keyKind === 'api' ? connection : undefined;
}

export function scopeLabelForKeyKind(keyKind: KeyKind): string {
  if (keyKind === 'admin') return 'Admin scope';
  if (keyKind === 'api') return 'Instance scope';
  return 'Unknown scope';
}
