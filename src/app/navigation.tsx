import type { KeyKind } from '@/lib/session';
import type { NavigationIconName } from '@/ui';

export type NavIcon = NavigationIconName;
export type NavItem = { to: string; label: string; icon: NavIcon; end?: boolean };
export type NavSection = { label: string; items: NavItem[] };

const overview = { to: '/overview', label: 'Overview', icon: 'overview', end: true } as const;

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
      { label: 'Runtime', items: [overview, { to: '/connection', label: 'Connection', icon: 'instances' }] },
      {
        label: 'Messaging',
        items: [
          { to: '/chats', label: 'Conversations', icon: 'chats' },
          { to: '/groups', label: 'Groups', icon: 'groups' },
          { to: '/messages', label: 'Campaigns', icon: 'campaigns' },
        ],
      },
      { label: 'Observability', items: [{ to: '/events', label: 'Events', icon: 'events' }] },
    ];
  }
  return [{ label: 'Runtime', items: [overview] }];
}

export function scopeLabelForKeyKind(keyKind: KeyKind): string {
  if (keyKind === 'admin') return 'Admin scope';
  if (keyKind === 'api') return 'Instance scope';
  return 'Unknown scope';
}
