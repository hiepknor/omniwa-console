import { useEffect, useRef, useState } from 'react';
import { ApiFailure, apiFailureDetail } from '@/api/envelopes';
import { IconButton, StateNotice } from '@/ui';

export function rateLimitPresentation(error: unknown, now = Date.now()): {
  rateLimited: boolean;
  remainingSeconds?: number;
  retryAllowed: boolean;
  suffix: string;
} {
  if (!(error instanceof ApiFailure) || error.category !== 'rate_limited') {
    return { rateLimited: false, retryAllowed: true, suffix: '' };
  }
  if (error.retryAt === undefined) {
    return { rateLimited: true, retryAllowed: false, suffix: ' Retry timing was not provided. Automatic retries are disabled.' };
  }
  const remainingSeconds = Math.max(0, Math.ceil((error.retryAt - now) / 1_000));
  return remainingSeconds > 0
    ? { rateLimited: true, remainingSeconds, retryAllowed: false, suffix: ` Retry available in ${remainingSeconds}s. Automatic retries are disabled.` }
    : { rateLimited: true, remainingSeconds: 0, retryAllowed: true, suffix: ' Cooldown ended. Retry is manual.' };
}

export function manualRetryDelay(random = Math.random): number {
  return Math.floor(250 + Math.min(1, Math.max(0, random())) * 750);
}

export function scheduleManualRetry(
  existingTimer: number | undefined,
  onRetry: () => void,
  schedule: (callback: () => void, delay: number) => number,
  random = Math.random,
): number {
  return existingTimer ?? schedule(onRetry, manualRetryDelay(random));
}

export function ApiFailureNotice({
  error,
  title = 'Request failed',
  kind = 'error',
  onRetry,
  retryLabel = 'Retry',
}: {
  error: unknown;
  title?: string;
  kind?: 'error' | 'empty';
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const failure = error instanceof ApiFailure ? error : undefined;
  const [now, setNow] = useState(() => Date.now());
  const [retryScheduled, setRetryScheduled] = useState(false);
  const retryTimer = useRef<number>();
  const rateLimit = rateLimitPresentation(error, now);

  useEffect(() => {
    setNow(Date.now());
    setRetryScheduled(false);
    return () => {
      if (retryTimer.current !== undefined) window.clearTimeout(retryTimer.current);
      retryTimer.current = undefined;
    };
  }, [error]);

  useEffect(() => {
    if (!rateLimit.rateLimited || rateLimit.retryAllowed || failure?.retryAt === undefined) return;
    const intervalId = window.setInterval(() => {
      const next = Date.now();
      setNow(next);
      if (next >= failure.retryAt!) window.clearInterval(intervalId);
    }, 1_000);
    return () => window.clearInterval(intervalId);
  }, [failure?.retryAt, rateLimit.rateLimited, rateLimit.retryAllowed]);

  const retry = () => {
    if (!onRetry || retryScheduled) return;
    if (!rateLimit.rateLimited) {
      onRetry();
      return;
    }
    setRetryScheduled(true);
    retryTimer.current = scheduleManualRetry(retryTimer.current, onRetry, (callback, delay) => window.setTimeout(callback, delay));
  };

  return (
    <StateNotice
      kind={kind}
      title={title}
      detail={`${apiFailureDetail(error)}${rateLimit.suffix}`}
      requestId={failure?.requestId}
      action={onRetry && rateLimit.retryAllowed ? <IconButton icon="refresh" label={retryScheduled ? `${retryLabel} scheduled` : retryLabel} busy={retryScheduled} onClick={retry} /> : undefined}
    />
  );
}
