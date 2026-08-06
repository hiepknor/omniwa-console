import type { ReactNode } from 'react';
import { cn } from './cn';
import { IconButton } from './IconButton';

/** Cursor pager: freshness/shown text on the left, First-page + Load-more on the right. */
export function CursorPagination({
  cursor,
  nextCursor,
  onCursor,
  resetLabel = 'First page',
  nextLabel = 'Load more',
  info,
  compactOnSmall = false,
}: {
  cursor?: string;
  nextCursor?: string;
  onCursor: (cursor?: string) => void;
  resetLabel?: string;
  nextLabel?: string;
  info?: ReactNode;
  compactOnSmall?: boolean;
}) {
  if (!cursor && !nextCursor && !info) return null;
  return (
    <div className={cn('flex items-center justify-between gap-3 p-3 border-t border-line', compactOnSmall ? 'max-sm:flex-row' : 'max-sm:flex-col max-sm:items-stretch')}>
      <div className={cn('text-xs text-fg-3', compactOnSmall && 'max-sm:sr-only')}>{info}</div>
      <div className={cn('flex gap-2', compactOnSmall && 'max-sm:flex-1 max-sm:justify-end')}>
        <IconButton icon="chevrons-left" label={resetLabel} disabled={!cursor} onClick={() => onCursor(undefined)} />
        <IconButton icon="chevron-right" label={nextLabel} disabled={!nextCursor} onClick={() => onCursor(nextCursor)} />
      </div>
    </div>
  );
}
