import type { ContactResource } from '@/api/contacts';
import type { LabelResource } from '@/api/labels';
import type { ReactNode } from 'react';
import { humanizeToken } from '@/lib/format';
import { Status } from '@/ui';
import { cn } from '@/ui/cn';

function ResourceButton({ selected, onClick, primary, secondary, trailing }: { selected?: boolean; onClick: () => void; primary: string; secondary: string; trailing: ReactNode }) {
  return (
    <li className={cn('border-b border-line last:border-b-0', selected && 'bg-elevated')}>
      <button type="button" onClick={onClick} className="flex min-h-[64px] w-full items-center justify-between gap-3 px-3 text-left hover:bg-elevated">
        <span className="grid min-w-0 gap-0.5">
          <strong className="truncate text-[13px] font-medium text-fg">{primary}</strong>
          <small className="truncate text-xs text-fg-3">{secondary}</small>
        </span>
        {trailing}
      </button>
    </li>
  );
}
export function ContactList({ items, selectedId, onSelect }: { items: ContactResource[]; selectedId?: string; onSelect: (id: string) => void }) {
  return <ul className="grid">{items.map((item) => (
    <ResourceButton
      key={item.id}
      selected={item.id === selectedId}
      onClick={() => onSelect(item.id)}
      primary={item.displayName ?? item.phoneNumber ?? 'Unknown contact'}
      secondary={item.identityStatus === 'legacy' ? 'Legacy identity' : `${humanizeToken(item.identityStatus)} identity`}
      trailing={<Status tone={item.found === true ? 'ok' : 'neutral'}>{item.found === undefined ? 'Unreported' : item.found ? 'Found' : 'Not found'}</Status>}
    />
  ))}</ul>;
}

export function LabelList({ items, selectedId, onSelect }: { items: LabelResource[]; selectedId?: string; onSelect: (id: string) => void }) {
  return <ul className="grid">{items.map((item) => (
    <ResourceButton
      key={item.id}
      selected={item.id === selectedId}
      onClick={() => onSelect(item.id)}
      primary={item.name ?? 'Unnamed label'}
      secondary={item.id}
      trailing={<span className="text-xs text-fg-3">{item.color ?? 'Color unreported'}</span>}
    />
  ))}</ul>;
}
