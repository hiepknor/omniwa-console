import type { GroupType } from '@/api/groups';
import { formatCount, humanizeToken } from '@/lib/format';
import { Status, type Tone } from '@/ui';

export function GroupTargetIdentity({ id, name, type }: { id: string; name?: string; type?: GroupType }) {
  return (
    <span className="grid min-w-0 gap-0.5">
      <strong className="truncate font-medium">{name ?? id}</strong>
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs text-fg-3">
        <code className="min-w-0 truncate font-mono">{id}</code>
        <span>{humanizeToken(type, 'Type unreported')}</span>
      </span>
    </span>
  );
}

export function ProjectedMemberCount({ count }: { count?: number }) {
  return <span className="font-mono tabular-nums" title="Projected member count">{formatCount(count)}</span>;
}

export function GroupTargetEligibility({ label, tone, reason }: { label: string; tone: Tone; reason?: string }) {
  return (
    <span className="grid min-w-0 max-w-44 gap-1">
      <Status tone={tone}>{label}</Status>
      {reason ? <small className="break-words text-xs leading-4 text-fg-3">{humanizeToken(reason)}</small> : null}
    </span>
  );
}
