import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { environmentForApiOrigin, WorkspaceEnvironmentProvider } from '@/components/EnvironmentBadge';
import { useDocumentTitle } from '@/components/useDocumentTitle';
import type { ConsoleSession } from '@/lib/session';
import { Button, buttonClassName, DescriptionItem, DescriptionList, Dialog, Icon, Logo, NavigationItemContent, navigationItemClassName } from '@/ui';
import { ConsoleFooter } from './ConsoleFooter';
import { navigationForKeyKind, pinnedNavigationForKeyKind, scopeLabelForKeyKind } from './navigation';
import { horizontalRevealScrollLeft, mainScrollScope, scrollTopForNavigation } from './scroll-behavior';

function environmentLabel(env: string): string {
  if (env === 'production') return 'Production';
  if (env === 'staging') return 'Staging';
  return 'Self-hosted';
}

export function Shell({ session, onDisconnect }: { session: ConsoleSession; onDisconnect: () => void }) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const capabilities = useServerCapabilities();
  const recoveryAvailable = capabilities.data?.capabilities.includes('projection_failure_operations') ?? false;
  const sections = navigationForKeyKind(session.keyKind, recoveryAvailable);
  const pinnedNavigation = pinnedNavigationForKeyKind(session.keyKind);
  const items = [...sections.flatMap((s) => s.items), ...(pinnedNavigation ? [pinnedNavigation] : [])];
  const active = items.find((i) => location.pathname === i.to || (!i.end && location.pathname.startsWith(`${i.to}/`)));
  useDocumentTitle(active?.label ?? 'OmniWA Console');
  const environment = environmentForApiOrigin(session.baseUrl);
  const viewportRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const navItemRefs = useRef(new Map<string, HTMLAnchorElement>());
  const scrollPositions = useRef(new Map<string, number>());
  const scrollState = useRef({ locationKey: location.key, scope: mainScrollScope(location.pathname, location.search) });
  const scrollScope = mainScrollScope(location.pathname, location.search);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const previous = scrollState.current;
    if (!viewport || previous.locationKey === location.key) return;

    scrollPositions.current.set(previous.locationKey, viewport.scrollTop);
    viewport.scrollTop = scrollTopForNavigation({
      navigationType,
      previousScope: previous.scope,
      nextScope: scrollScope,
      currentTop: viewport.scrollTop,
      savedTop: scrollPositions.current.get(location.key),
    });
    scrollState.current = { locationKey: location.key, scope: scrollScope };
  }, [location.key, navigationType, scrollScope]);

  useEffect(() => {
    const nav = navRef.current;
    const activeItem = active ? navItemRefs.current.get(active.to) : undefined;
    if (!nav || !activeItem || !window.matchMedia('(width < 640px)').matches) return;
    nav.scrollLeft = horizontalRevealScrollLeft(
      nav.scrollLeft,
      nav.getBoundingClientRect(),
      activeItem.getBoundingClientRect(),
    );
  }, [active?.to]);

  const capabilityStatus = capabilities.isPending
    ? { tone: 'pending' as const, label: 'Discovering capabilities' }
    : capabilities.isError
      ? { tone: 'failed' as const, label: 'Capability discovery failed' }
      : { tone: 'ok' as const, label: `${capabilities.data.capabilities.length} capabilities` };

  return (
    <WorkspaceEnvironmentProvider environment={environment}>
      <div className="fixed inset-0 grid overflow-hidden grid-cols-[224px_minmax(0,1fr)] max-[900px]:grid-cols-[64px_minmax(0,1fr)] max-[640px]:block">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:bg-fg focus:px-3 focus:py-2 focus:text-bg"
        >
          Skip to main content
        </a>

        <aside
          aria-label="OmniWA primary navigation"
          className="flex min-w-0 flex-col h-dvh border-r border-line-strong bg-surface max-[640px]:fixed max-[640px]:inset-x-0 max-[640px]:bottom-0 max-[640px]:z-40 max-[640px]:h-auto max-[640px]:flex-row max-[640px]:border-r-0 max-[640px]:border-t max-[640px]:border-b-0"
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

          {/* Nav */}
          <nav ref={navRef} aria-label="Primary" className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 max-[640px]:flex max-[640px]:overflow-x-auto max-[640px]:p-2">
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
                    ref={(node) => {
                      if (node) navItemRefs.current.set(item.to, node);
                      else navItemRefs.current.delete(item.to);
                    }}
                    className={({ isActive }) =>
                      navigationItemClassName(isActive)
                    }
                  >
                    <NavigationItemContent icon={item.icon} label={item.label} />
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          {pinnedNavigation ? (
            <nav
              aria-label="Runtime connection"
              className="shrink-0 border-t border-line p-3 max-[640px]:w-[60px] max-[640px]:border-t-0 max-[640px]:border-l max-[640px]:p-2"
            >
              <NavLink
                to={pinnedNavigation.to}
                end={pinnedNavigation.end}
                title={pinnedNavigation.label}
                aria-label={pinnedNavigation.label}
                className={({ isActive }) => buttonClassName(
                  isActive ? 'primary' : 'ghost',
                  'w-full gap-2 px-3 max-[900px]:size-9 max-[900px]:gap-0 max-[900px]:px-0 max-[640px]:size-11 max-[640px]:min-h-11',
                )}
              >
                <Icon name={pinnedNavigation.icon} size="nav" />
                <span className="max-[900px]:sr-only">{pinnedNavigation.label}</span>
              </NavLink>
            </nav>
          ) : (
            <div className="shrink-0 border-t border-line p-3 max-[640px]:w-[60px] max-[640px]:border-t-0 max-[640px]:border-l max-[640px]:p-2">
              <Button
                onClick={() => setSessionDialogOpen(true)}
                aria-label="Console session"
                title="Console session"
                className="w-full max-[900px]:size-9 max-[640px]:size-11 max-[640px]:min-h-11"
              >
                <Icon name="session" size="nav" />
                <span className="max-[900px]:sr-only">Session</span>
              </Button>
            </div>
          )}
        </aside>

        <main id="main" tabIndex={-1} className="flex min-w-0 h-dvh flex-col overflow-hidden max-[640px]:pb-[61px]">
          <div ref={viewportRef} className="min-h-0 flex-1 overflow-auto overscroll-y-contain">
            <Suspense fallback={<div role="status" className="p-6 text-sm text-fg-3">Loading panel…</div>}>
              <Outlet context={{ onEndConsoleSession: onDisconnect }} />
            </Suspense>
          </div>
          <ConsoleFooter
            environment={environmentLabel(environment)}
            scope={scopeLabelForKeyKind(session.keyKind)}
            capabilityLabel={capabilityStatus.label}
            capabilityTone={capabilityStatus.tone}
            version={capabilities.data?.version}
            revision={capabilities.data?.revision}
          />
        </main>

        <Dialog
          open={sessionDialogOpen}
          onClose={() => setSessionDialogOpen(false)}
          title="Console session"
          footer={(
            <>
              <Button onClick={() => setSessionDialogOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={onDisconnect}>End Console session</Button>
            </>
          )}
        >
          <div className="grid gap-4">
            <p className="text-sm text-fg-2">
              End this browser session and return to Connect. This clears the in-memory credential without sending a server command.
            </p>
            <DescriptionList>
              <DescriptionItem label="API origin" mono>{session.baseUrl}</DescriptionItem>
              <DescriptionItem label="Credential scope">{scopeLabelForKeyKind(session.keyKind)}</DescriptionItem>
              <DescriptionItem label="Credential lifetime">Memory-only</DescriptionItem>
            </DescriptionList>
          </div>
        </Dialog>
      </div>
    </WorkspaceEnvironmentProvider>
  );
}
