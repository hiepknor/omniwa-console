import { Status, type Tone } from '@/ui';

export function ConsoleFooter({
  environment,
  scope,
  capabilityLabel,
  capabilityTone,
  version,
  revision,
}: {
  environment: string;
  scope: string;
  capabilityLabel: string;
  capabilityTone: Tone;
  version?: string;
  revision?: string;
}) {
  return (
    <footer
      aria-label="Console runtime context"
      className="grid h-9 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 border-t border-line bg-surface px-4 text-[11px] text-fg-3 max-[640px]:hidden"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex shrink-0 items-center border border-line-strong px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
          {environment}
        </span>
        <span className="truncate">{scope}</span>
      </div>

      <Status tone={capabilityTone}>{capabilityLabel}</Status>

      <div className="flex min-w-0 items-center justify-end gap-4 whitespace-nowrap max-[760px]:invisible">
        {version ? <span className="truncate font-mono text-[10px]" title={revision}>GO {version}</span> : null}
        <span>Memory-only</span>
      </div>
    </footer>
  );
}
