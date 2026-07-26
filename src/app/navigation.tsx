import type { ReactNode } from 'react';
import type { KeyKind } from '@/lib/session';

export type NavIcon = 'overview' | 'recovery' | 'instances' | 'chats' | 'groups' | 'campaigns' | 'events';
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
      { label: 'Runtime', items: [overview] },
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

const paths: Record<NavIcon, ReactNode> = {
  overview: <><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></>,
  recovery: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
  instances: <><rect x="3" y="4" width="18" height="7" /><rect x="3" y="13" width="18" height="7" /><path d="M7 7.5h.01M7 16.5h.01" /></>,
  chats: <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  groups: <><circle cx="9" cy="8" r="4" /><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2M16 4a4 4 0 0 1 0 8M18 15a5 5 0 0 1 4 4.9V21" /></>,
  campaigns: <><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></>,
  events: <path d="M3 12h4l3 8 4-16 3 8h4" />,
};

export function NavIconSvg({ name }: { name: NavIcon }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter">
      {paths[name]}
    </svg>
  );
}
