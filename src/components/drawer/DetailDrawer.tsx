import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useDrawerFocus } from '@/components/useDrawerFocus';

function useModalDrawer(): boolean {
  const query = '(max-width: 1279px)';
  const [modal, setModal] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setModal(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return modal;
}

function CloseIcon() {
  return <svg className="!h-4 !w-4" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>;
}

export function DetailDrawer({
  titleId,
  eyebrow,
  title,
  titleClassName,
  status,
  subtitle,
  onClose,
  closeLabel = 'Close details',
  suppressEscape = false,
  className = '',
  children,
}: {
  titleId: string;
  eyebrow: string;
  title: ReactNode;
  titleClassName?: string;
  status?: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  closeLabel?: string;
  suppressEscape?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const modal = useModalDrawer();
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useDrawerFocus({ onClose, closeRef, drawerRef, modal, suppressEscape });

  const drawer = (
    <aside
      ref={drawerRef}
      className={`drawer ${modal ? 'detail-drawer-modal' : 'detail-drawer'} ${className} !fixed !inset-y-0 !right-0 !z-[60] !m-0 !flex !h-[100dvh] !w-[min(440px,100vw)] !max-w-none !flex-col !overflow-hidden !rounded-none !border-0 !border-l !border-[var(--border)] !bg-[var(--surface)] !shadow-[var(--elev-raised)] min-[1280px]:!z-20`}
      aria-labelledby={titleId}
      {...(modal ? { role: 'dialog', 'aria-modal': true } : {})}
      tabIndex={-1}
    >
      <header className="drawer-head !flex !min-h-28 !shrink-0 !items-start !justify-between !gap-4 !border-b !border-[var(--border-subtle)] !bg-[var(--bg)] !px-6 !py-5 max-[640px]:!px-4 max-[640px]:!py-4">
        <div className="drawer-identity !min-w-0 !flex-1">
          <span className="eyebrow !mb-2">{eyebrow}</span>
          <div className="drawer-title-row !flex !min-w-0 !items-center !gap-3 !mb-1">
            <h2 id={titleId} className={`!min-w-0 !overflow-hidden !text-ellipsis !whitespace-nowrap ${titleClassName ?? ''}`}>{title}</h2>
            {status}
          </div>
          {subtitle && <div className="drawer-subtitle !min-w-0 !overflow-hidden !text-ellipsis !whitespace-nowrap text-[11px] leading-[17px] text-[var(--muted)]">{subtitle}</div>}
        </div>
        <button ref={closeRef} className="close !flex !h-11 !w-11 !basis-11 !items-center !justify-center !rounded-[var(--radius-sm)] !border !border-[var(--border-subtle)] !bg-[var(--accent)] !p-0 !text-[var(--muted)]" type="button" aria-label={closeLabel} title="Close" onClick={onClose}><CloseIcon /></button>
      </header>
      <div className="drawer-scroll !min-h-0 !flex-1 !overflow-y-auto overscroll-contain">{children}</div>
    </aside>
  );

  if (!modal) return drawer;
  return <div className="fixed inset-0 z-50 bg-[color-mix(in_oklab,var(--bg)_72%,transparent)]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !suppressEscape) onClose(); }}>{drawer}</div>;
}

export function DetailDrawerState({ children, announce = false }: { children: ReactNode; announce?: boolean }) {
  return <div className="empty !min-h-56 !px-6 !py-10" {...(announce ? { 'aria-live': 'polite' as const } : {})}>{children}</div>;
}
