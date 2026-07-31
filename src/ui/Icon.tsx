import type { ReactNode, SVGProps } from 'react';
import { cn } from './cn';

export type NavigationIconName = 'overview' | 'recovery' | 'instances' | 'connection' | 'conversations' | 'directory' | 'groups' | 'campaigns' | 'events' | 'session';
export type IconName = NavigationIconName | 'close' | 'chevron-down';
export type IconSize = 'sm' | 'md' | 'nav';

const paths: Record<IconName, ReactNode> = {
  close: <path d="m4 4 8 8M12 4l-8 8" />,
  'chevron-down': <path d="m3.5 5.5 4.5 5 4.5-5" />,
  overview: <><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></>,
  recovery: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
  instances: <><rect x="3" y="4" width="18" height="7" /><rect x="3" y="13" width="18" height="7" /><path d="M7 7.5h.01M7 16.5h.01" /></>,
  connection: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1" /></>,
  conversations: <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  directory: <><circle cx="9" cy="8" r="4" /><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2M16 7h6M16 12h6M16 17h6" /></>,
  groups: <><circle cx="9" cy="8" r="4" /><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2M16 4a4 4 0 0 1 0 8M18 15a5 5 0 0 1 4 4.9V21" /></>,
  campaigns: <><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></>,
  events: <path d="M3 12h4l3 8 4-16 3 8h4" />,
  session: <><circle cx="8" cy="12" r="4" /><path d="M12 12h9M17 12v3M20 12v2" /></>,
};

const viewBox: Record<IconName, string> = {
  close: '0 0 16 16',
  'chevron-down': '0 0 16 16',
  overview: '0 0 24 24',
  recovery: '0 0 24 24',
  instances: '0 0 24 24',
  connection: '0 0 24 24',
  conversations: '0 0 24 24',
  directory: '0 0 24 24',
  groups: '0 0 24 24',
  campaigns: '0 0 24 24',
  events: '0 0 24 24',
  session: '0 0 24 24',
};

const sizes: Record<IconSize, string> = { sm: 'size-3', md: 'size-3.5', nav: 'size-[18px]' };

/** Canonical monochrome line icon. Icons are decorative; the adjacent text or control supplies the accessible name. */
export function Icon({ name, size = 'md', className, ...props }: Omit<SVGProps<SVGSVGElement>, 'name'> & { name: IconName; size?: IconSize }) {
  return (
    <svg
      {...props}
      aria-hidden
      viewBox={viewBox[name]}
      className={cn(sizes[size], 'shrink-0', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      {paths[name]}
    </svg>
  );
}
