import { ApiFailure } from '@/api/envelopes';

export function InlineError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const failure = error instanceof ApiFailure ? error : undefined;
  const category = failure?.category ?? 'unknown';
  const message = error instanceof Error ? error.message : 'Request failed';

  return (
    <div className="overview-error" role="alert">
      <span>
        {category}: {message}
        {failure?.requestId && <span className="mono"> · {failure.requestId}</span>}
      </span>
      {failure?.retryable && (
        <button className="btn sm" type="button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
