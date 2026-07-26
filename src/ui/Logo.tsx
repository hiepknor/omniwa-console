import { cn } from './cn';

/** Square logomark — a flat accent tile with a mono "O". */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex items-center justify-center size-7 shrink-0 bg-fg text-bg font-mono text-sm font-semibold leading-none',
        className,
      )}
    >
      O
    </span>
  );
}
