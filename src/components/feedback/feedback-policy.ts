import { ApiFailure } from '@/api/envelopes';
import type { FeedbackInput } from './feedback-types';

export function isTransportError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  return error instanceof Error && /failed to fetch|load failed|networkerror/i.test(error.message);
}

export function apiErrorFeedback({
  title,
  error,
  dedupeKey,
  action,
}: {
  title: string;
  error: unknown;
  dedupeKey?: string;
  action?: FeedbackInput['action'];
}): FeedbackInput {
  const failure = error instanceof ApiFailure ? error : undefined;
  return {
    kind: 'error',
    title,
    detail: `${failure?.category ?? 'unknown'} · ${error instanceof Error ? error.message : 'Request failed'}`,
    requestId: failure?.requestId,
    dedupeKey,
    ...(failure?.retryable && action ? { action } : {}),
  };
}
