import { useRef, type KeyboardEvent, type ReactNode, type SelectHTMLAttributes } from 'react';
import { useDrawerFocus } from '@/components/useDrawerFocus';
import { useModalDialog } from '@/components/useModalDialog';
import { Button, Status } from './primitives';
import { presentUiState, type UiState } from './state-model';

export function StateNotice({ value, detail, requestId, action }: { value: UiState; detail?: string; requestId?: string; action?: ReactNode }) {
  const state = presentUiState(value);
  return (
    <section className="ui-v2-state" data-axis={value.axis} data-state={value.state} data-blocking={state.blocking || undefined} data-retains-data={state.retainsData || undefined} role={state.tone === 'failed' ? 'alert' : 'status'} aria-busy={state.busy || undefined}>
      <div className="ui-v2-state__copy">
        <Status tone={state.tone}>{state.label}</Status>
        <h3>{state.title}</h3>
        {detail ? <p>{detail}</p> : null}
        {requestId ? <span className="ui-v2-state__request ui-v2-mono">Request {requestId}</span> : null}
      </div>
      {action ? <div className="ui-v2-state__action">{action}</div> : null}
    </section>
  );
}

export type TabItem = { id: string; label: string; count?: number };

export function Tabs({ label, items, selectedId, onSelect }: { label: string; items: TabItem[]; selectedId: string; onSelect: (id: string) => void }) {
  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | undefined;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % items.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + items.length) % items.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = items.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    onSelect(items[nextIndex].id);
    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs?.[nextIndex]?.focus();
  };
  return (
    <div className="ui-v2-tabs" role="tablist" aria-label={label}>
      {items.map((item, index) => <button key={item.id} type="button" role="tab" id={`${item.id}-tab`} aria-controls={`${item.id}-panel`} aria-selected={item.id === selectedId} tabIndex={item.id === selectedId ? 0 : -1} onClick={() => onSelect(item.id)} onKeyDown={(event) => moveFocus(event, index)}>{item.label}{item.count === undefined ? null : <span className="ui-v2-tabs__count">{item.count}</span>}</button>)}
    </div>
  );
}

export function ScopeSelector({ label = 'Active scope', className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return <label className="ui-v2-scope"><span>{label}</span><select {...props} className={className}>{children}</select></label>;
}

export function Dialog({ titleId, eyebrow = 'Command', title, description, children, actions, onClose, canClose = true }: { titleId: string; eyebrow?: string; title: string; description?: string; children: ReactNode; actions: ReactNode; onClose: () => void; canClose?: boolean }) {
  const dialogRef = useModalDialog<HTMLDivElement>({ onClose, canClose });
  return (
    <div className="ui-v2-dialog-layer" role="presentation" onMouseDown={(event) => { if (canClose && event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} className="ui-v2-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? `${titleId}-description` : undefined} tabIndex={-1}>
        <header><div><span className="ui-v2-eyebrow">{eyebrow}</span><h2 id={titleId}>{title}</h2></div><Button onClick={onClose} disabled={!canClose} aria-label="Close dialog">Close</Button></header>
        <div className="ui-v2-dialog__body">{description ? <p id={`${titleId}-description`}>{description}</p> : null}{children}</div>
        <footer>{actions}</footer>
      </div>
    </div>
  );
}

export function Inspector({ titleId, eyebrow = 'Details', title, status, subtitle, modal = false, onClose, children }: { titleId: string; eyebrow?: string; title: string; status?: ReactNode; subtitle?: ReactNode; modal?: boolean; onClose: () => void; children: ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const inspectorRef = useRef<HTMLElement>(null);
  useDrawerFocus({ onClose, closeRef, drawerRef: inspectorRef, modal });
  const inspector = <aside ref={inspectorRef} className="ui-v2-inspector" aria-labelledby={titleId} {...(modal ? { role: 'dialog', 'aria-modal': true } : {})} tabIndex={-1}><header><div><span className="ui-v2-eyebrow">{eyebrow}</span><h2 id={titleId}>{title}</h2>{subtitle ? <div className="ui-v2-inspector__subtitle">{subtitle}</div> : null}</div>{status}<Button ref={closeRef} onClick={onClose} aria-label="Close details">Close</Button></header><div className="ui-v2-inspector__body">{children}</div></aside>;
  return modal ? <div className="ui-v2-inspector-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>{inspector}</div> : inspector;
}
