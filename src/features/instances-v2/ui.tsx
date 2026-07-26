import { ApiFailure } from '@/api/envelopes';
import { Button, StateNotice } from '@/ui';

/** Error/stale/command notice built on the v3 StateNotice + ApiFailure. */
export function FailureNotice({
  error,
  stale,
  command,
  onRetry,
}: {
  error: unknown;
  stale?: boolean;
  command?: boolean;
  onRetry?: () => void;
}) {
  const failure = error instanceof ApiFailure ? error : undefined;
  const title = command ? 'Command failed' : stale ? 'Showing last known data' : 'Read failed';
  return (
    <StateNotice
      kind="error"
      title={title}
      detail={failure?.message ?? 'An unexpected error occurred.'}
      requestId={failure?.requestId}
      action={onRetry ? <Button onClick={onRetry}>Retry</Button> : undefined}
    />
  );
}
