import { NavLink, Outlet } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { keyFingerprint, type ConsoleSession } from '@/lib/session';

type IconName =
  | 'overview'
  | 'instances'
  | 'queue'
  | 'webhooks'
  | 'events'
  | 'settings'
  | 'keys';

type NavItem = {
  to: string;
  label: string;
  icon: IconName;
  adminOnly?: boolean;
};

const OVERVIEW_ITEM: NavItem = { to: '/overview', label: 'Overview', icon: 'overview' };

const OPERATION_ITEMS: NavItem[] = [
  { to: '/instances', label: 'Instances', icon: 'instances' },
  { to: '/queue', label: 'Queue & Jobs', icon: 'queue' },
  { to: '/webhooks', label: 'Webhooks', icon: 'webhooks' },
  { to: '/events', label: 'Events', icon: 'events' },
];

const SYSTEM_ITEMS: NavItem[] = [
  { to: '/settings', label: 'Settings', icon: 'settings' },
  { to: '/settings/api-keys', label: 'API Keys', icon: 'keys', adminOnly: true },
];

function NavIcon({ name }: { name: IconName }) {
  const content = {
    overview: (
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </>
    ),
    instances: (
      <>
        <rect x="3" y="4" width="18" height="7" rx="1.5" />
        <rect x="3" y="13" width="18" height="7" rx="1.5" />
        <path d="M7 7.5h.01M7 16.5h.01" />
      </>
    ),
    queue: <path d="M4 6h16M4 12h16M4 18h10" />,
    webhooks: (
      <>
        <path d="M10 14 21 3M15 3h6v6" />
        <path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
      </>
    ),
    events: <path d="M3 12h4l3 8 4-16 3 8h4" />,
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
      </>
    ),
    keys: (
      <>
        <circle cx="8" cy="15" r="4" />
        <path d="m11 12 8-8M15 8l2 2M17 6l2 2" />
      </>
    ),
  }[name];

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {content}
    </svg>
  );
}

function NavigationLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/settings'}
      title={item.label}
      aria-label={item.label}
      className={({ isActive }) => `warp-nav-link${isActive ? ' warp-nav-link-active' : ''}`}
    >
      <NavIcon name={item.icon} />
      <span className="warp-nav-label">{item.label}</span>
    </NavLink>
  );
}

export function Shell({
  session,
  onDisconnect,
}: {
  session: ConsoleSession;
  onDisconnect: () => void;
}) {
  const systemItems = SYSTEM_ITEMS.filter(
    (item) => !item.adminOnly || session.keyKind === 'admin',
  );
  const fingerprint = keyFingerprint(session.apiKey);

  return (
    <div className="warp-shell">
      <aside className="warp-sidebar" aria-label="OmniWA primary navigation">
        <div className="warp-brand">
          <Logo size={32} />
          <div className="warp-brand-copy">
            <strong>OmniWA Console</strong>
            <span title={`API endpoint: ${session.baseUrl}`}>{session.baseUrl}</span>
          </div>
        </div>

        <nav className="warp-nav" aria-label="Primary">
          <NavigationLink item={OVERVIEW_ITEM} />
          <span className="warp-nav-section">Operations</span>
          {OPERATION_ITEMS.map((item) => (
            <NavigationLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="warp-nav-foot">
          {systemItems.map((item) => (
            <NavigationLink key={item.to} item={item} />
          ))}
        </div>

        <div className="warp-session-wrap">
          <div
            className="warp-session"
            aria-label={`Connected session ${fingerprint}, ${session.keyKind}`}
            title={`Connected · ${fingerprint} · ${session.keyKind}`}
          >
            <span className="warp-session-dot" aria-hidden="true" />
            <span className="warp-session-key">{fingerprint}</span>
            <span className="warp-session-kind">{session.keyKind}</span>
            <button
              type="button"
              onClick={onDisconnect}
              className="warp-disconnect"
              aria-label="Disconnect session"
              title="Disconnect"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.4 6.6a9 9 0 1 1-12.8 0M12 2v8" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="warp-main">
        <Outlet />
      </main>
    </div>
  );
}
