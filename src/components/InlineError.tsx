import { useEffect, useRef, useState } from 'react';
import { ApiFailure } from '@/api/envelopes';
import { useLocation } from 'react-router-dom';
import { useFeedback } from './feedback/FeedbackProvider';
import { deferTransportErrorToWorkspace } from './feedback/feedback-policy';
import { jitteredRetryDelay, nextCountdownDelay, retryCountdownSeconds } from './retry-timing';
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
  const [retryScheduled, setRetryScheduled] = useState(false);
  const retryTimerRef = useRef<number>();
  const onRetryRef = useRef(onRetry);
  onRetryRef.current = onRetry;
  const retryAt = failure?.retryAt;
  const retryAfter = retryCountdownSeconds(retryAt, now);
  const rateLimited = failure?.category === 'rate_limited';

  useEffect(() => {
    setNow(Date.now());
    setRetryScheduled(false);
    if (retryTimerRef.current !== undefined) window.clearTimeout(retryTimerRef.current);
    retryTimerRef.current = undefined;
    return () => {
      if (retryTimerRef.current !== undefined) window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = undefined;
    };
  }, [retryAt]);

  useEffect(() => {
    const delay = nextCountdownDelay(retryAt, now);
    if (delay === undefined) return undefined;
    const timer = window.setTimeout(() => setNow(Date.now()), delay);
    return () => window.clearTimeout(timer);
  }, [now, retryAt]);

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
        ? retryScheduled
          ? 'Retry scheduled with a short jitter.'
          : retryAfter === undefined
          ? 'Automatic retries are disabled to protect the WhatsApp session.'
          : retryAfter > 0
            ? `Retry available in ${retryAfter}s. Automatic retries are disabled.`
            : 'The server cooldown has ended. A retry will include a short jitter.'
        : failure?.code === 'projection_not_ready'
          ? 'The projection is not ready. No live WhatsApp lookup will be used as a fallback.'
          : undefined}
      requestId={failure?.requestId}
      action={!retryScheduled && (failure?.retryable || (rateLimited && retryAfter === 0))
        ? {
            label: 'Retry',
            run: () => {
              if (rateLimited) {
                if (retryTimerRef.current !== undefined) return;
                setRetryScheduled(true);
                retryTimerRef.current = window.setTimeout(() => {
                  retryTimerRef.current = undefined;
                  setRetryScheduled(false);
                  onRetryRef.current();
                }, jitteredRetryDelay(Math.random()));
              } else {
                onRetryRef.current();
              }
            },
          }
        : undefined}
      className={className}
      announcement={announce ? 'assertive' : false}
    />
  );
}
