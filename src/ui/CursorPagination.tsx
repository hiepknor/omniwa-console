import type { ReactNode } from 'react';
import { Button } from './Button';

/** Cursor pager: freshness/shown text on the left, First-page + Load-more on the right. */
export function CursorPagination({
  cursor,
  nextCursor,
  onCursor,
  resetLabel = 'First page',
  nextLabel = 'Load more',
  info,
}: {
  cursor?: string;
  nextCursor?: string;
  onCursor: (cursor?: string) => void;
  resetLabel?: string;
  nextLabel?: string;
  info?: ReactNode;
}) {
  if (!cursor && !nextCursor && !info) return null;
  return (
    <div className="flex items-center justify-between gap-3 p-3 border-t border-line max-sm:flex-col max-sm:items-stretch">
      <div className="text-xs text-fg-3">{info}</div>
      <div className="flex gap-2 max-sm:grid max-sm:grid-cols-2">
        <Button disabled={!cursor} onClick={() => onCursor(undefined)}>{resetLabel}</Button>
        <Button disabled={!nextCursor} onClick={() => onCursor(nextCursor)}>{nextLabel}</Button>
      </div>
    </div>
  );
}
