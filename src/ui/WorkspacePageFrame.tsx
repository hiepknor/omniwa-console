import { useCallback, useEffect, useRef, type ReactNode, type Ref } from 'react';
import { PageHeader } from './PageHeader';

export function useWorkspacePageFocus(detailKey?: string) {
  const compactHeadingRef = useRef<HTMLHeadingElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const previousDetailKeyRef = useRef(detailKey);
  const rememberFocusOrigin = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) returnFocusRef.current = document.activeElement;
  }, []);

  useEffect(() => {
    const previousDetailKey = previousDetailKeyRef.current;
    previousDetailKeyRef.current = detailKey;
    if (!window.matchMedia('(width < 900px)').matches) return;
    if (detailKey) {
      compactHeadingRef.current?.focus();
    } else if (previousDetailKey) {
      (returnFocusRef.current?.isConnected ? returnFocusRef.current : compactHeadingRef.current)?.focus();
    }
  }, [detailKey]);

  return { compactHeadingRef, rememberFocusOrigin };
}

export function WorkspacePageFrame({
  eyebrow,
  title,
  description,
  secondaryActions,
  primaryAction,
  compactTitle,
  compactDescription,
  compactLeadingAction,
  compactActions,
  compactHeadingRef,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  secondaryActions?: ReactNode;
  primaryAction?: ReactNode;
  compactTitle?: ReactNode;
  compactDescription?: ReactNode;
  compactLeadingAction?: ReactNode;
  compactActions?: ReactNode;
  compactHeadingRef?: Ref<HTMLHeadingElement>;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="px-6 pt-6 max-[900px]:hidden">
        <PageHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          secondaryActions={secondaryActions}
          primaryAction={primaryAction}
        />
      </div>

      <header className="flex min-h-[57px] shrink-0 items-center gap-3 border-b border-line bg-surface px-4 min-[900px]:hidden">
        {compactLeadingAction ? <div className="flex shrink-0 items-center">{compactLeadingAction}</div> : null}
        <div className="grid min-w-0 flex-1">
          <h1 ref={compactHeadingRef} tabIndex={-1} className="truncate text-sm font-semibold text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg">
            {compactTitle ?? title}
          </h1>
          {compactDescription ? <span className="truncate text-xs text-fg-3">{compactDescription}</span> : null}
        </div>
        {compactActions ? <div className="flex shrink-0 items-center gap-2">{compactActions}</div> : null}
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">{children}</div>
    </div>
  );
}
