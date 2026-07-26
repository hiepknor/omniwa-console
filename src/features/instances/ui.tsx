import { ApiFailureNotice } from '@/components/ApiFailureNotice';

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
  const title = command ? 'Command failed' : stale ? 'Showing last known data' : 'Read failed';
  return <ApiFailureNotice error={error} title={title} onRetry={onRetry} />;
}
