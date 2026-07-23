import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export function Button({ variant = 'secondary', className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button {...props} type={type} className={classes('ui-v2-button', `ui-v2-button--${variant}`, className)} />;
}

export type StatusTone = 'healthy' | 'pending' | 'degraded' | 'failed' | 'neutral';

export function Status({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return <span className="ui-v2-status" data-tone={tone}><span className="ui-v2-status__dot" aria-hidden="true" />{children}</span>;
}

export function Surface({ title, description, actions, children, className }: { title: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={classes('ui-v2-surface', className)}>
      <header className="ui-v2-surface__header">
        <div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
        {actions ? <div className="ui-v2-surface__actions">{actions}</div> : null}
      </header>
      <div className="ui-v2-surface__body">{children}</div>
    </section>
  );
}

export function Field({ label, hint, error, id, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const fieldId = id ?? `ui-v2-${props.name ?? label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const descriptionId = hint || error ? `${fieldId}-description` : undefined;
  return (
    <label className="ui-v2-field" htmlFor={fieldId}>
      <span className="ui-v2-field__label">{label}</span>
      <input {...props} id={fieldId} className={classes('ui-v2-input', className)} aria-invalid={error ? true : undefined} aria-describedby={descriptionId} />
      {descriptionId ? <span className="ui-v2-field__hint" id={descriptionId} data-error={error ? true : undefined}>{error ?? hint}</span> : null}
    </label>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="ui-v2-page-header">
      <div className="ui-v2-page-header__copy">
        {eyebrow ? <span className="ui-v2-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="ui-v2-page-header__actions">{actions}</div> : null}
    </header>
  );
}

export function UiV2Boundary({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={classes('ui-v2-root', className)} data-ui-generation="v2">{children}</div>;
}
