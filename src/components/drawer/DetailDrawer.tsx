import { useEffect, useRef, useState, type ReactNode } from 'react';
import { IconButton } from '@/components/IconButton';
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
  return <svg className="!h-4 !w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>;
}

function CopyIcon({ copied }: { copied: boolean }) {
  return copied
    ? <svg className="!h-4 !w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
    : <svg className="!h-4 !w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>;
}

export function DrawerIdentifier({ value, label = 'Copy identifier' }: { value: string; label?: string }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const resetTimerRef = useRef<number | undefined>(undefined);
  const copied = copyState === 'copied';

  useEffect(() => () => window.clearTimeout(resetTimerRef.current), []);

  const copy = async () => {
    window.clearTimeout(resetTimerRef.current);
    try {
      await navigator.clipboard.writeText(value);
      setCopyState('copied');
      resetTimerRef.current = window.setTimeout(() => setCopyState('idle'), 1600);
    } catch {
      setCopyState('failed');
      resetTimerRef.current = window.setTimeout(() => setCopyState('idle'), 2400);
    }
  };

  return (
    <span className="!grid !min-h-11 !min-w-0 !grid-cols-[minmax(0,1fr)_44px] !items-center">
      <span className="mono !min-w-0 !overflow-hidden !text-ellipsis !whitespace-nowrap" title={value}>{value}</span>
      <IconButton compact className="!justify-self-end" surfaceClassName="!border-transparent !bg-transparent group-hover:!bg-[var(--accent-hover)]" label={`${label}: ${value}`} title={copied ? 'Copied' : label} onClick={() => void copy()}><CopyIcon copied={copied} /></IconButton>
      <span className="visually-hidden" aria-live="polite">{copyState === 'copied' ? 'Identifier copied.' : copyState === 'failed' ? 'Could not copy identifier.' : ''}</span>
    </span>
  );
}

export function DrawerTechnicalValue({ value, fallback = '—' }: { value: string | undefined; fallback?: string }) {
  return <span className="mono !block !min-w-0 !whitespace-normal [overflow-wrap:anywhere]" title={value}>{value ?? fallback}</span>;
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
      className={`drawer ${modal ? 'detail-drawer-modal' : 'detail-drawer'} ${className} !fixed !inset-y-0 !right-0 !z-[60] !m-0 !flex !h-[100dvh] !w-[min(440px,100vw)] !max-w-none !flex-col !overflow-hidden !rounded-none !border-0 !border-l !border-[var(--border)] !bg-[var(--surface)] !shadow-[var(--elev-raised)] [&_.drawer-note]:!text-[var(--fg-2)] [&_.help]:!text-[var(--fg-2)] pointer-coarse:[&_.btn]:!min-h-11 pointer-coarse:[&_.btn]:!min-w-11 pointer-coarse:[&_.webhook-delivery-link]:!min-h-11 min-[1280px]:!z-20`}
      aria-labelledby={titleId}
      {...(modal ? { role: 'dialog', 'aria-modal': true } : {})}
      tabIndex={-1}
    >
      <header className="drawer-head !grid !min-h-28 !shrink-0 !grid-cols-[minmax(0,1fr)_44px] !items-start !gap-x-4 !border-b !border-[var(--border-subtle)] !bg-[var(--bg)] !px-6 !py-5 max-[640px]:!px-4 max-[640px]:!py-4">
        <div className="drawer-identity !min-w-0 !flex-1">
          <span className="eyebrow !mb-2">{eyebrow}</span>
          <div className="drawer-title-row !grid !min-w-0 !grid-cols-[minmax(0,1fr)_auto] !items-center !gap-3 !mb-1">
            <h2 id={titleId} className={`!w-auto !max-w-full !min-w-0 !overflow-hidden !text-ellipsis !whitespace-nowrap ${titleClassName ?? ''}`}>{title}</h2>
            {status && <span className="!justify-self-end">{status}</span>}
          </div>
          {subtitle && <div className="drawer-subtitle !min-w-0 !overflow-hidden !text-ellipsis !whitespace-nowrap text-[11px] leading-[17px] text-[var(--fg-2)]">{subtitle}</div>}
        </div>
        <IconButton compact ref={closeRef} className="close !-mt-2" label={closeLabel} title="Close" onClick={onClose}><CloseIcon /></IconButton>
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
