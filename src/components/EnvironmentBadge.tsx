import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type WorkspaceEnvironment = 'platform' | 'mock';

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

  if (environment !== 'mock' || (placement === 'page' && drawerCount > 0)) return null;

  return (
    <span
      data-badge="environment"
      className={`inline-flex min-h-[22px] shrink-0 items-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[color-mix(in_oklab,var(--fg)_3%,transparent)] font-[var(--ui)] text-[10px] font-medium uppercase leading-4 tracking-[0.6px] text-[var(--muted)] ${className}`}
      aria-label="Mock environment. Deterministic local fixture data; no platform requests are sent."
      title="Deterministic local fixture data; no platform requests are sent."
    >
      <span className="!px-2">Mock data</span>
    </span>
  );
}
