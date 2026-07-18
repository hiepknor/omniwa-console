import { ApiFailure } from '@/api/envelopes';
import { SurfaceNotice } from './feedback/SurfaceNotice';

export function InlineError({
  error,
  onRetry,
  className = 'overview-error',
  announce = false,
}: {
  error: unknown;
  onRetry: () => void;
  className?: string;
  announce?: boolean;
}) {
  const failure = error instanceof ApiFailure ? error : undefined;
  const category = failure?.category ?? 'unknown';
  const message = error instanceof Error ? error.message : 'Request failed';

  return (
    <SurfaceNotice
      kind="error"
      label={category}
      title={message}
      requestId={failure?.requestId}
      showMissingRequestId
      action={failure?.retryable ? { label: 'Retry', run: onRetry } : undefined}
      className={className}
      announcement={announce ? 'assertive' : false}
    />
  );
}
