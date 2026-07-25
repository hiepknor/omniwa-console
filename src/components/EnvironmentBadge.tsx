import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type WorkspaceEnvironment = 'production' | 'staging' | 'platform' | 'mock';

export function environmentForApiOrigin(baseUrl: string): WorkspaceEnvironment {
  try {
    const hostname = new URL(baseUrl).hostname.toLowerCase();
    if (hostname === 'api.onio.cc') return 'production';
    if (hostname === 'staging-api.onio.cc') return 'staging';
  } catch {
    // A connected session is already origin-validated; retain a safe generic
    // label if this helper is reused with malformed input.
  }
  return 'platform';
}

type WorkspaceEnvironmentContextValue = {
  environment: WorkspaceEnvironment;
  drawerCount: number;
  registerDrawer: () => () => void;
};

const WorkspaceEnvironmentContext = createContext<WorkspaceEnvironmentContextValue>({
  environment: 'platform',
  drawerCount: 0,
  registerDrawer: () => () => undefined,
});

export function WorkspaceEnvironmentProvider({
  environment,
  children,
}: {
  environment: WorkspaceEnvironment;
  children: ReactNode;
}) {
  const [drawerCount, setDrawerCount] = useState(0);
  const registerDrawer = useCallback(() => {
    setDrawerCount((count) => count + 1);
    return () => setDrawerCount((count) => Math.max(0, count - 1));
  }, []);
  const value = useMemo(
    () => ({ environment, drawerCount, registerDrawer }),
    [drawerCount, environment, registerDrawer],
  );

  return (
    <WorkspaceEnvironmentContext.Provider value={value}>
      {children}
    </WorkspaceEnvironmentContext.Provider>
  );
}

export function useWorkspaceEnvironment() {
  return useContext(WorkspaceEnvironmentContext);
}

export function EnvironmentBadge({
  className = '',
  placement = 'surface',
}: {
  className?: string;
  placement?: 'page' | 'surface';
}) {
  const { environment, drawerCount } = useWorkspaceEnvironment();

  if (placement === 'page' && drawerCount > 0) return null;

  const presentation = {
    production: {
      label: 'Production',
      description: 'Production API environment.',
    },
    staging: {
      label: 'Staging',
      description: 'Staging API environment.',
    },
    platform: {
      label: 'Platform',
      description: 'Operator-supplied OmniWA GO API environment.',
    },
    mock: {
      label: 'Mock data',
      description: 'Mock environment. Deterministic local fixture data; no platform requests are sent.',
    },
  }[environment];

  return (
    <span
      data-badge="environment"
      className={`inline-flex min-h-[22px] shrink-0 items-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[color-mix(in_oklab,var(--fg)_3%,transparent)] font-[var(--ui)] text-[10px] font-medium uppercase leading-4 tracking-[0.6px] text-[var(--muted)] ${className}`}
      aria-label={presentation.description}
      title={presentation.description}
    >
      <span className="!px-2">{presentation.label}</span>
    </span>
  );
}
