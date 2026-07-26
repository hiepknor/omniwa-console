import type { KeyboardEvent, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from './cn';

/** Dense table workhorse. Square container, hairline dividers, horizontal scroll bounded locally. */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0 max-w-full w-full overflow-x-auto border border-line-strong bg-surface', className)}>
      <table className="w-full border-collapse text-[13px]">{children}</table>
    </div>
  );
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-9 px-3 text-left align-middle text-[11px] font-medium uppercase tracking-wider text-fg-3 border-b border-line',
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('h-11 px-3 align-middle text-fg border-b border-line', className)} {...props} />;
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
        'last:[&>td]:border-b-0',
        onClick && 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
        selected ? 'bg-elevated' : 'hover:bg-elevated',
        className,
      )}
    >
      {children}
    </tr>
  );
}
