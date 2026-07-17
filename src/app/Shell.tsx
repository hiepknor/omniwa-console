import { NavLink, Outlet } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { keyFingerprint, type ConsoleSession } from '@/lib/session';

const NAV_ITEMS: Array<{ to: string; label: string; adminOnly?: boolean }> = [
  { to: '/overview', label: 'Overview' },
  { to: '/instances', label: 'Instances' },
  { to: '/queue', label: 'Queue & Jobs' },
  { to: '/webhooks', label: 'Webhooks' },
  { to: '/events', label: 'Events' },
  { to: '/settings', label: 'Settings' },
  { to: '/settings/api-keys', label: 'API Keys', adminOnly: true },
];

export function Shell({
  session,
  onDisconnect,
}: {
  session: ConsoleSession;
  onDisconnect: () => void;
}) {
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || session.keyKind === 'admin');

  return (
    <div className="flex min-h-screen text-[#faf9f6]">
      <aside className="warp-sidebar flex w-56 shrink-0 flex-col border-r">
        <div className="warp-divider flex items-center gap-2.5 border-b px-4 py-3.5">
          <Logo />
          <div className="min-w-0">
            <div className="text-sm font-medium">OmniWA Console</div>
            <div className="truncate font-mono text-xs text-[#666469]">{session.baseUrl}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/settings'}
              className={({ isActive }) =>
                `warp-nav-link block rounded-lg px-3 py-2 text-sm ${isActive ? 'warp-nav-link-active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="warp-divider border-t p-3 text-xs text-[#868584]">
          <div>key {keyFingerprint(session.apiKey)}</div>
          <button
            type="button"
            onClick={onDisconnect}
            className="warp-ghost mt-2 w-full rounded-lg px-2 py-1"
          >
            Disconnect
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
