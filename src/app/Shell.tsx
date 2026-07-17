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
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-800">
        <div className="flex items-center gap-2.5 border-b border-zinc-800 px-4 py-3.5">
          <Logo />
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-wide">OmniWA Console</div>
            <div className="truncate font-mono text-xs text-zinc-500">{session.baseUrl}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/settings'}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm ${
                  isActive
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-zinc-800 p-3 text-xs text-zinc-500">
          <div>key {keyFingerprint(session.apiKey)}</div>
          <button
            type="button"
            onClick={onDisconnect}
            className="mt-2 w-full rounded border border-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-800"
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
