import type { ReactNode, SVGProps } from 'react';
import { cn } from './cn';

export type NavigationIconName = 'overview' | 'recovery' | 'instances' | 'connection' | 'conversations' | 'directory' | 'groups' | 'campaigns' | 'events' | 'session';
export type IconName = NavigationIconName
  | 'arrow-left'
  | 'check'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevrons-left'
  | 'close'
  | 'copy'
  | 'filter'
  | 'panel-right'
  | 'refresh'
  | 'search'
  | 'tag';
export type IconSize = 'sm' | 'md' | 'nav';

const paths: Record<IconName, ReactNode> = {
  'arrow-left': <><path d="M19 12H5M11 18l-6-6 6-6" /></>,
  check: <path d="m4 12 5 5L20 6" />,
  close: <path d="m4 4 8 8M12 4l-8 8" />,
  'chevron-down': <path d="m3.5 5.5 4.5 5 4.5-5" />,
  'chevron-right': <path d="m9 18 6-6-6-6" />,
  'chevrons-left': <><path d="m11 17-5-5 5-5M18 17l-5-5 5-5" /></>,
  copy: <><rect x="8" y="8" width="11" height="11" /><path d="M16 8V5H5v11h3" /></>,
  filter: <path d="M4 5h16l-6 7v6l-4 2v-8z" />,
  'panel-right': <><rect x="3" y="4" width="18" height="16" /><path d="M14 4v16M17 8h1M17 12h1" /></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 8A7 7 0 0 1 18.7 7L20 12M4 12l1.3 5A7 7 0 0 0 17.9 16" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
  tag: <><path d="M20 13 13 20 4 11V4h7z" /><path d="M8 8h.01" /></>,
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
  'arrow-left': '0 0 24 24',
  check: '0 0 24 24',
  close: '0 0 16 16',
  'chevron-down': '0 0 16 16',
  'chevron-right': '0 0 24 24',
  'chevrons-left': '0 0 24 24',
  copy: '0 0 24 24',
  filter: '0 0 24 24',
  'panel-right': '0 0 24 24',
  refresh: '0 0 24 24',
  search: '0 0 24 24',
  tag: '0 0 24 24',
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
