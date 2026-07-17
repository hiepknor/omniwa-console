import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { keyFingerprint, type ConsoleSession } from '@/lib/session';

type IconName =
  | 'overview'
  | 'instances'
  | 'queue'
  | 'webhooks'
  | 'events'
  | 'chats'
  | 'groups'
  | 'messages'
  | 'settings'
  | 'keys'
  | 'more';

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

const MESSAGING_ITEMS: NavItem[] = [
  { to: '/chats', label: 'Chats', icon: 'chats' },
  { to: '/groups', label: 'Groups', icon: 'groups' },
  { to: '/messages', label: 'Messages', icon: 'messages' },
];

const SYSTEM_ITEMS: NavItem[] = [
  { to: '/settings', label: 'Settings', icon: 'settings' },
  { to: '/settings/api-keys', label: 'API Keys', icon: 'keys', adminOnly: true },
];

const MOBILE_PRIMARY_ITEMS: NavItem[] = [
  OVERVIEW_ITEM,
  OPERATION_ITEMS[0],
  { ...OPERATION_ITEMS[1], label: 'Queue' },
  MESSAGING_ITEMS[0],
];

const TABLET_RAIL_STORAGE_KEY = 'omniwa-console:tablet-rail-expanded';

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
    chats: <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    groups: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
        <path d="M15.5 3.1a4 4 0 0 1 0 7.8" />
      </>
    ),
    messages: (
      <>
        <path d="m22 2-7 20-4-9-9-4z" />
        <path d="M22 2 11 13" />
      </>
    ),
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
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
  }[name];

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {content}
    </svg>
  );
}

function NavigationLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/settings'}
      title={item.label}
      aria-label={item.label}
      className={({ isActive }) => (isActive ? 'active' : undefined)}
      onClick={onClick}
    >
      <NavIcon name={item.icon} />
      <span className="lbl">{item.label}</span>
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
  const moreItems = [
    OPERATION_ITEMS[2],
    OPERATION_ITEMS[3],
    MESSAGING_ITEMS[1],
    MESSAGING_ITEMS[2],
    ...systemItems,
  ];
  const fingerprint = keyFingerprint(session.apiKey);
  const location = useLocation();
  const [tabletExpanded, setTabletExpanded] = useState(() => {
    try {
      return window.localStorage.getItem(TABLET_RAIL_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const moreTriggerRef = useRef<HTMLButtonElement>(null);
  const moreDialogRef = useRef<HTMLDivElement>(null);
  const moreActive = moreItems.some(
    (item) =>
      location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
  );

  useEffect(() => {
    if (!mobileMoreOpen) return;

    const dialog = moreDialogRef.current;
    const previousOverflow = document.body.style.overflow;
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    );
    document.body.style.overflow = 'hidden';
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMoreOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      moreTriggerRef.current?.focus();
    };
  }, [mobileMoreOpen]);

  useEffect(() => {
    setMobileMoreOpen(false);
  }, [location.pathname]);

  const toggleTabletRail = () => {
    setTabletExpanded((expanded) => {
      const next = !expanded;
      try {
        window.localStorage.setItem(TABLET_RAIL_STORAGE_KEY, String(next));
      } catch {
        // The preference remains in memory when browser storage is unavailable.
      }
      return next;
    });
  };

  return (
    <div className="shell">
      <aside
        className={`sidebar${tabletExpanded ? ' is-expanded' : ''}`}
        aria-label="OmniWA primary navigation"
      >
        <div className="logo">
          <Logo size={32} />
          <div>
            <b>OmniWA Console</b>
            <span className="env" title={`API endpoint: ${session.baseUrl}`}>
              {session.baseUrl}
            </span>
          </div>
        </div>

        <nav className="desktop-nav" aria-label="Primary">
          <NavigationLink item={OVERVIEW_ITEM} />
          <span className="navlabel">Operations</span>
          {OPERATION_ITEMS.map((item) => (
            <NavigationLink key={item.to} item={item} />
          ))}
          <span className="navlabel">Messaging</span>
          {MESSAGING_ITEMS.map((item) => (
            <NavigationLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="navfoot desktop-utility">
          <button
            type="button"
            className="rail-toggle"
            onClick={toggleTabletRail}
            aria-label={tabletExpanded ? 'Collapse navigation' : 'Expand navigation'}
            aria-expanded={tabletExpanded}
            title={tabletExpanded ? 'Collapse navigation' : 'Expand navigation'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
            <span className="lbl">{tabletExpanded ? 'Collapse' : 'Expand'}</span>
          </button>
          {systemItems.map((item) => (
            <NavigationLink key={item.to} item={item} />
          ))}
        </div>

        <nav className="mobile-nav" aria-label="Mobile primary navigation">
          {MOBILE_PRIMARY_ITEMS.map((item) => (
            <NavigationLink key={item.to} item={item} />
          ))}
          <button
            ref={moreTriggerRef}
            type="button"
            className={moreActive ? 'active' : undefined}
            onClick={() => setMobileMoreOpen(true)}
            aria-label="More navigation"
            aria-haspopup="dialog"
            aria-expanded={mobileMoreOpen}
            aria-controls="mobile-more-navigation"
          >
            <NavIcon name="more" />
            <span className="lbl">More</span>
          </button>
        </nav>

        <div className="side-foot">
          <div
            className="session"
            aria-label={`Connected session. API key ${fingerprint}.`}
            title={`Connected · API key ${fingerprint}`}
          >
            <span
              className="dot"
              style={{ background: 'var(--ok)' }}
              aria-hidden="true"
            />
            <span className="session-copy">
              <strong>Connected</strong>
              <span className="key">API key · {fingerprint}</span>
            </span>
            <button
              type="button"
              onClick={onDisconnect}
              className="out"
              aria-label="Sign out of API session"
              title="Sign out of API session"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 8l4 4-4 4" />
                <path d="M18 12H8" />
                <path d="M10 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {mobileMoreOpen ? (
        <div
          className="mobile-more-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMobileMoreOpen(false);
          }}
        >
          <div
            ref={moreDialogRef}
            id="mobile-more-navigation"
            className="mobile-more-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
          >
            <header>
              <div>
                <span className="eyebrow">Navigation</span>
                <h2 id="mobile-more-title">More</h2>
              </div>
              <button
                type="button"
                className="mobile-more-close"
                onClick={() => setMobileMoreOpen(false)}
                aria-label="Close navigation"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </header>
            <nav aria-label="More destinations">
              {moreItems.map((item) => (
                <NavigationLink
                  key={item.to}
                  item={item}
                  onClick={() => setMobileMoreOpen(false)}
                />
              ))}
            </nav>
          </div>
        </div>
      ) : null}

      <main>
        <Outlet />
      </main>
    </div>
  );
}
