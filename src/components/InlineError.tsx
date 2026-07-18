import { ApiFailure } from '@/api/envelopes';

export function InlineError({
  error,
  onRetry,
  className = 'overview-error',
}: {
  error: unknown;
  onRetry: () => void;
  className?: string;
}) {
  const failure = error instanceof ApiFailure ? error : undefined;
  const category = failure?.category ?? 'unknown';
  const message = error instanceof Error ? error.message : 'Request failed';

  return (
    <div className={className} role="alert">
      <span>
        {category}: {message}
        <span className="mono"> · {failure?.requestId ?? 'Request ID unavailable'}</span>
      </span>
      {failure?.retryable && (
        <button className="btn sm" type="button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
