import { useEffect, useState } from 'react';
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
  const [now, setNow] = useState(Date.now());
  const retryAt = failure?.retryAt;
  const retryAfter = retryAt === undefined ? undefined : Math.max(0, Math.ceil((retryAt - now) / 1_000));
  const rateLimited = failure?.category === 'rate_limited';

  useEffect(() => {
    if (retryAt === undefined || retryAt <= Date.now()) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  if (deferTransportErrorToWorkspace({
    error,
    offline: transport.status === 'offline',
    pathname: location.pathname,
  })) return null;

  return (
    <SurfaceNotice
      kind="error"
      label={failure?.code ?? category}
      title={message}
      detail={rateLimited
        ? retryAfter === undefined
          ? 'Automatic retries are disabled to protect the WhatsApp session.'
          : retryAfter > 0
            ? `Retry available in ${retryAfter}s. Automatic retries are disabled.`
            : 'The server cooldown has ended. A retry will include a short jitter.'
        : failure?.code === 'projection_not_ready'
          ? 'The projection is not ready. No live WhatsApp lookup will be used as a fallback.'
          : undefined}
      requestId={failure?.requestId}
      action={failure?.retryable || (rateLimited && retryAfter === 0)
        ? {
            label: 'Retry',
            run: () => {
              if (rateLimited) {
                window.setTimeout(onRetry, 250 + Math.floor(Math.random() * 751));
              } else {
                onRetry();
              }
            },
          }
        : undefined}
      className={className}
      announcement={announce ? 'assertive' : false}
    />
  );
}
