import type { ContactResource } from '@/api/contacts';
import type { LabelResource } from '@/api/labels';
import type { ReactNode } from 'react';
import { humanizeToken, relativeTime } from '@/lib/format';
import { Status, Table, Td, Th, Tr } from '@/ui';
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
export function ContactTable({ items, selectedId, onSelect, className }: { items: ContactResource[]; selectedId?: string; onSelect: (id: string) => void; className?: string }) {
  return (
    <Table className={className}>
      <thead><tr><Th>Contact</Th><Th>Phone</Th><Th priority="supporting">Identity</Th><Th>WhatsApp</Th><Th priority="detail">Updated</Th></tr></thead>
      <tbody>{items.map((item) => (
        <Tr key={item.id} selected={item.id === selectedId} onClick={() => onSelect(item.id)}>
          <Td mobileLabel="Contact"><div className="grid gap-0.5"><span className="font-medium">{item.displayName ?? item.phoneNumber ?? 'Unknown contact'}</span><small className="font-mono text-xs text-fg-3">{item.id}</small></div></Td>
          <Td mobileLabel="Phone" className="font-mono text-xs text-fg-2">{item.phoneNumber ?? item.redactedPhone ?? 'Not reported'}</Td>
          <Td mobileLabel="Identity" priority="supporting"><Status tone={item.identityStatus === 'complete' ? 'ok' : item.identityStatus === 'partial' ? 'pending' : 'neutral'}>{humanizeToken(item.identityStatus)}</Status></Td>
          <Td mobileLabel="WhatsApp"><Status tone={item.found === true ? 'ok' : 'neutral'}>{item.found === undefined ? 'Unreported' : item.found ? 'Found' : 'Not found'}</Status></Td>
          <Td mobileLabel="Updated" priority="detail" className="text-fg-2">{item.identityUpdatedAt ? <time dateTime={item.identityUpdatedAt} title={item.identityUpdatedAt}>{relativeTime(item.identityUpdatedAt) || item.identityUpdatedAt}</time> : 'Not reported'}</Td>
        </Tr>
      ))}</tbody>
    </Table>
  );
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
