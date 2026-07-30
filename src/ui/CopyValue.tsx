import { useEffect, useState, type ReactNode } from 'react';
import { Button } from './Button';
import { cn } from './cn';

/** Copyable diagnostic value for DescriptionLists and other inspector facts. */
export function CopyValue({ value, label, children, className }: { value: string; label: string; children?: ReactNode; className?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  useEffect(() => setState('idle'), [value]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      setState('failed');
    }
  };

  return (
    <span className={cn('inline-flex max-w-full items-start justify-end gap-2 max-sm:justify-start', className)}>
      <span className="min-w-0 break-words">{children ?? value}</span>
      <Button className="h-6 shrink-0 text-[11px] max-sm:h-8" aria-label={`Copy ${label}`} onClick={() => { void copy(); }}>
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Retry copy' : 'Copy'}
      </Button>
      <span className="sr-only" aria-live="polite">{state === 'copied' ? `${label} copied.` : state === 'failed' ? `Could not copy ${label}.` : ''}</span>
    </span>
  );
}
