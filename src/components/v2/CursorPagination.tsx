import type { ReactNode } from 'react';
import { Button } from './primitives';

/**
 * Opaque-cursor pager shared by every v2 list surface. The cursor is never
 * decoded: "Next page" forwards the server-provided `nextCursor` verbatim and
 * the reset control returns to the first page by clearing it. `label` overrides
 * the default page descriptor; `resetLabel` names the reset control for panels
 * whose reset also clears selection (e.g. Recovery uses "First page").
 */
export function CursorPagination({
  cursor,
  nextCursor,
  onCursor,
  label,
  resetLabel = 'Start over',
}: {
  cursor?: string;
  nextCursor?: string | null;
  onCursor: (cursor?: string) => void;
  label?: ReactNode;
  resetLabel?: string;
}) {
  return (
    <div className="ui-v2-pagination">
      <span>{label ?? (cursor ? 'Opaque cursor page' : 'First page')}</span>
      <div>
        {cursor ? <Button onClick={() => onCursor()}>{resetLabel}</Button> : null}
        <Button disabled={!nextCursor} onClick={() => onCursor(nextCursor ?? undefined)}>Next page</Button>
      </div>
    </div>
  );
}
