import { Suspense } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { environmentForApiOrigin, WorkspaceEnvironmentProvider } from '@/components/EnvironmentBadge';
import { useDocumentTitle } from '@/components/useDocumentTitle';
import type { ConsoleSession } from '@/lib/session';
import { Button, Icon, Logo, NavigationItemContent, navigationItemClassName, Status } from '@/ui';
import { navigationForKeyKind, scopeLabelForKeyKind } from './navigation';

function environmentLabel(env: string): string {
  if (env === 'production') return 'Production';
  if (env === 'staging') return 'Staging';
  return 'Self-hosted';
}

export function Shell({ session, onDisconnect }: { session: ConsoleSession; onDisconnect: () => void }) {
  const location = useLocation();
  const capabilities = useServerCapabilities();
  const recoveryAvailable = capabilities.data?.capabilities.includes('projection_failure_operations') ?? false;
  const sections = navigationForKeyKind(session.keyKind, recoveryAvailable);
  const items = sections.flatMap((s) => s.items);
  const active = items.find((i) => location.pathname === i.to || (!i.end && location.pathname.startsWith(`${i.to}/`)));
  useDocumentTitle(active?.label ?? 'OmniWA Console');
  const environment = environmentForApiOrigin(session.baseUrl);

  const capabilityStatus = capabilities.isPending
    ? { tone: 'pending' as const, label: 'Discovering capabilities' }
    : capabilities.isError
      ? { tone: 'failed' as const, label: 'Capability discovery failed' }
      : { tone: 'ok' as const, label: `${capabilities.data.capabilities.length} capabilities` };

  return (
    <WorkspaceEnvironmentProvider environment={environment}>
      <div className="grid h-dvh grid-cols-[224px_minmax(0,1fr)] max-[900px]:grid-cols-[64px_minmax(0,1fr)] max-[640px]:block">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:bg-fg focus:px-3 focus:py-2 focus:text-bg"
        >
          Skip to main content
        </a>

        <aside
          aria-label="OmniWA primary navigation"
          className="flex min-w-0 flex-col h-dvh border-r border-line-strong bg-surface max-[640px]:fixed max-[640px]:inset-x-0 max-[640px]:bottom-0 max-[640px]:z-40 max-[640px]:h-auto max-[640px]:border-r-0 max-[640px]:border-t max-[640px]:border-b-0"
        >
          {/* Brand */}
          <div className="flex items-center gap-3 min-h-[57px] px-4 border-b border-line max-[900px]:justify-center max-[900px]:px-0 max-[640px]:hidden">
            <Logo />
            <span className="grid min-w-0 max-[900px]:hidden">
              <strong className="text-[13px] font-semibold text-fg">OmniWA Console</strong>
              <span className="truncate font-mono text-[10px] text-fg-3" title={session.baseUrl}>
                {session.baseUrl}
              </span>
            </span>
          </div>

          {/* Context */}
          <div className="grid gap-2 p-4 border-b border-line max-[900px]:hidden">
            <div className="flex items-center justify-between gap-2 text-[11px] text-fg-3">
              <span className="inline-flex items-center border border-line-strong px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                {environmentLabel(environment)}
              </span>
              <span>{scopeLabelForKeyKind(session.keyKind)}</span>
            </div>
            <Status tone={capabilityStatus.tone}>{capabilityStatus.label}</Status>
            {capabilities.data?.version ? (
              <span className="font-mono text-[10px] text-fg-3" title={capabilities.data.revision}>
                GO {capabilities.data.version}
              </span>
            ) : null}
          </div>

          {/* Nav */}
          <nav aria-label="Primary" className="flex-1 min-h-0 overflow-y-auto p-3 max-[640px]:flex max-[640px]:overflow-x-auto max-[640px]:p-2">
            {sections.map((section) => (
              <div key={section.label} className="mb-4 grid gap-0.5 max-[640px]:mb-0 max-[640px]:flex">
                <span className="px-2.5 pb-1 text-[9px] font-medium uppercase tracking-[0.14em] text-fg-3 max-[900px]:hidden">
                  {section.label}
                </span>
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={item.label}
                    aria-label={item.label}
                    className={({ isActive }) =>
                      navigationItemClassName(isActive)
                    }
                  >
                    <NavigationItemContent icon={item.icon} label={item.label} />
                  </NavLink>
                ))}
              </div>
            ))}
            <button
              type="button"
              aria-label="Sign out"
              title="Sign out"
              onClick={onDisconnect}
              className={navigationItemClassName(false, 'hidden max-[900px]:flex max-[640px]:sticky max-[640px]:right-0 max-[640px]:z-10 max-[640px]:bg-surface')}
            >
              <Icon name="signout" size="nav" />
              <span className="max-[900px]:hidden max-[640px]:inline max-[640px]:text-[10px]">Sign out</span>
            </button>
          </nav>

          {/* Session footer */}
          <footer className="grid gap-3 p-3 border-t border-line max-[900px]:hidden">
            <div className="grid gap-0.5">
              <Status tone="ok">Connected</Status>
              <span className="font-mono text-[10px] text-fg-3">In-memory credential</span>
            </div>
            <Button onClick={onDisconnect} aria-label="Sign out" title="Sign out" className="w-full">
              Sign out
            </Button>
          </footer>
        </aside>

        <main id="main" tabIndex={-1} className="min-w-0 h-dvh overflow-auto max-[640px]:pb-[61px]">
          <Suspense fallback={<div role="status" className="p-6 text-sm text-fg-3">Loading panel…</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </WorkspaceEnvironmentProvider>
  );
}
