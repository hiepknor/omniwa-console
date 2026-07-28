import type { KeyboardEvent, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from './cn';

export type TableColumnPriority = 'essential' | 'supporting' | 'detail';

const columnPriorityClass: Record<TableColumnPriority, string> = {
  essential: '',
  supporting: '@min-[40.0625rem]:@max-[48rem]:hidden',
  detail: '@min-[40.0625rem]:@max-[60rem]:hidden',
};

/**
 * Dense table workhorse. Responsiveness follows the table container instead of
 * the viewport: compact rows become labelled records, narrow and regular tables
 * progressively reduce supporting/detail columns, and wide tables retain all.
 */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('@container min-w-0 max-w-full w-full overflow-x-auto border border-line-strong bg-surface', className)}>
      <table className="w-full border-collapse text-[13px] @max-[40rem]:block @max-[40rem]:[&_thead]:sr-only @max-[40rem]:[&_tbody]:block">
        {children}
      </table>
    </div>
  );
}

export function Th({ className, priority = 'essential', scope = 'col', ...props }: ThHTMLAttributes<HTMLTableCellElement> & { priority?: TableColumnPriority }) {
  return (
    <th
      className={cn(
        'h-9 px-3 text-left align-middle text-[11px] font-medium uppercase tracking-wider text-fg-3 border-b border-line',
        columnPriorityClass[priority],
        className,
      )}
      scope={scope}
      {...props}
    />
  );
}

export function Td({
  children,
  className,
  mobileLabel,
  multiline = false,
  priority = 'essential',
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & {
  mobileLabel: string;
  multiline?: boolean;
  priority?: TableColumnPriority;
}) {
  return (
    <td
      className={cn(
        'h-11 px-3 align-middle text-fg border-b border-line @max-[40rem]:grid @max-[40rem]:h-auto @max-[40rem]:min-h-11 @max-[40rem]:w-full @max-[40rem]:min-w-0 @max-[40rem]:grid-cols-[minmax(6.5rem,34%)_minmax(0,1fr)] @max-[40rem]:items-start @max-[40rem]:gap-3 @max-[40rem]:py-2',
        columnPriorityClass[priority],
        multiline && 'py-2',
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="hidden pt-0.5 text-left font-sans text-[10px] font-medium uppercase leading-4 tracking-wider text-fg-3 @max-[40rem]:block">
        {mobileLabel}
      </span>
      <div className="min-w-0 [overflow-wrap:anywhere]">{children}</div>
    </td>
  );
}

export function Tr({
  children,
  className,
  onClick,
  selected,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}) {
  const onKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onClick();
  };
  return (
    <tr
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={onClick ? 0 : undefined}
      aria-selected={selected}
      className={cn(
        'last:[&>td]:border-b-0 @max-[40rem]:grid @max-[40rem]:border-b @max-[40rem]:border-line @max-[40rem]:[&>td]:border-b-0 @max-[40rem]:last:border-b-0',
        onClick && 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
        selected ? 'bg-elevated' : 'hover:bg-elevated',
        className,
      )}
    >
      {children}
    </tr>
  );
}
