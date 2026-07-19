import { ApiFailure } from '@/api/envelopes';
import { useLocation } from 'react-router-dom';
import { useFeedback } from './feedback/FeedbackProvider';
import { deferTransportErrorToWorkspace } from './feedback/feedback-policy';
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
  const location = useLocation();
  const { transport } = useFeedback();
  const failure = error instanceof ApiFailure ? error : undefined;
  const category = failure?.category ?? 'unknown';
  const message = error instanceof Error ? error.message : 'Request failed';

  if (deferTransportErrorToWorkspace({
    error,
    offline: transport.status === 'offline',
    pathname: location.pathname,
  })) return null;

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
