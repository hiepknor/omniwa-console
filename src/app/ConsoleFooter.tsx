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
      className="flex h-10 shrink-0 items-center justify-between gap-4 border-t border-line bg-surface px-4 text-[11px] text-fg-3 max-[640px]:hidden"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-fg-2">
          {environment}
        </span>
        <span className="truncate border-l border-line pl-3">{scope}</span>
      </div>

      <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
        <Status tone={capabilityTone}>{capabilityLabel}</Status>
        {version ? (
          <span className="border-l border-line pl-3 font-mono text-[10px] max-[900px]:hidden" title={revision}>
            GO {version}
          </span>
        ) : null}
        <span className="border-l border-line pl-3 max-[900px]:hidden">Memory-only credential</span>
      </div>
    </footer>
  );
}
