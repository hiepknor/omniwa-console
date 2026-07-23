import { Suspense, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { Button, Status, UiV2Boundary } from '@/components/v2';
import { environmentForApiOrigin, WorkspaceEnvironmentProvider } from '@/components/EnvironmentBadge';
import { useDocumentTitle } from '@/components/useDocumentTitle';
import type { ConsoleSession, KeyKind } from '@/lib/session';

type V2IconName = 'overview' | 'recovery' | 'instances' | 'chats' | 'groups' | 'campaigns' | 'events';
type V2NavItem = { to: string; label: string; icon: V2IconName; end?: boolean };
type V2NavSection = { label: string; items: V2NavItem[] };

const overview = { to: '/overview', label: 'Overview', icon: 'overview', end: true } as const;

export function navigationForKeyKind(keyKind: KeyKind, recoveryAvailable = false): V2NavSection[] {
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

function ShellIcon({ name }: { name: V2IconName }) {
  const content: Record<V2IconName, ReactNode> = {
    overview: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    recovery: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
    instances: <><rect x="3" y="4" width="18" height="7" rx="1.5" /><rect x="3" y="13" width="18" height="7" rx="1.5" /><path d="M7 7.5h.01M7 16.5h.01" /></>,
    chats: <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    groups: <><circle cx="9" cy="8" r="4" /><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2M16 4a4 4 0 0 1 0 8M18 15a5 5 0 0 1 4 4.9V21" /></>,
    campaigns: <><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></>,
    events: <path d="M3 12h4l3 8 4-16 3 8h4" />,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{content[name]}</svg>;
}

function EnvironmentLabel({ baseUrl }: { baseUrl: string }) {
  const environment = environmentForApiOrigin(baseUrl);
  const label =
    environment === 'production'
      ? 'Production'
      : environment === 'staging'
        ? 'Staging'
        : 'Self-hosted';
  return (
    <span className="ui-v2-shell__environment" data-environment={environment}>
      {label}
    </span>
  );
}

export function ShellV2({ session, onDisconnect }: { session: ConsoleSession; onDisconnect: () => void }) {
  const location = useLocation();
  const capabilities = useServerCapabilities();
  const recoveryAvailable = capabilities.data?.capabilities.includes('projection_failure_operations') ?? false;
  const sections = navigationForKeyKind(session.keyKind, recoveryAvailable);
  const allItems = sections.flatMap((section) => section.items);
  const active = allItems.find(
    (item) =>
      location.pathname === item.to ||
      (!item.end && location.pathname.startsWith(`${item.to}/`)),
  );
  useDocumentTitle(active?.label ?? 'OmniWA Console');
  const environment = environmentForApiOrigin(session.baseUrl);
  const capabilityStatus = capabilities.isPending
    ? { tone: 'pending' as const, label: 'Discovering capabilities' }
    : capabilities.isError
      ? { tone: 'failed' as const, label: 'Capability discovery failed' }
      : { tone: 'healthy' as const, label: `${capabilities.data.capabilities.length} capabilities` };

  return (
    <WorkspaceEnvironmentProvider environment={environment}>
      <UiV2Boundary className="ui-v2-shell">
        <a className="ui-v2-skip-link" href="#ui-v2-main">Skip to main content</a>
        <aside className="ui-v2-shell__rail" aria-label="OmniWA primary navigation">
          <div className="ui-v2-shell__brand">
            <span className="ui-v2-shell__mark" aria-hidden="true">OW</span>
            <span>
              <strong>OmniWA Console</strong>
              <span title={session.baseUrl}>{session.baseUrl}</span>
            </span>
          </div>
          <div className="ui-v2-shell__context">
            <div>
              <EnvironmentLabel baseUrl={session.baseUrl} />
              <span>{scopeLabelForKeyKind(session.keyKind)}</span>
            </div>
            <Status tone={capabilityStatus.tone}>{capabilityStatus.label}</Status>
            {capabilities.data?.version ? (
              <span className="ui-v2-mono" title={capabilities.data.revision}>
                GO {capabilities.data.version}
              </span>
            ) : null}
          </div>
          <nav className="ui-v2-shell__nav" aria-label="Primary">
            {sections.map((section) => (
              <div className="ui-v2-shell__nav-section" key={section.label}>
                <span className="ui-v2-shell__nav-label">{section.label}</span>
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                  >
                    <ShellIcon name={item.icon} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
          <footer className="ui-v2-shell__session">
            <div>
              <Status tone="healthy">Connected</Status>
              <span className="ui-v2-mono">In-memory credential</span>
            </div>
            <Button onClick={onDisconnect}>Sign out</Button>
          </footer>
        </aside>
        <main id="ui-v2-main" className="ui-v2-shell__main ui-legacy-root" tabIndex={-1}>
          <Suspense
            fallback={<div className="ui-v2-route-loading" role="status">Loading panel…</div>}
          >
            <Outlet />
          </Suspense>
        </main>
      </UiV2Boundary>
    </WorkspaceEnvironmentProvider>
  );
}
