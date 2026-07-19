import { ApiFailure } from '@/api/envelopes';
import type { FeedbackInput } from './feedback-types';

export function isTransportError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  return error instanceof Error && /failed to fetch|load failed|networkerror/i.test(error.message);
}

/** Routes with a PageHeader delegate browser transport failures to WorkspaceBanner. */
export function hasCanonicalWorkspaceBanner(pathname: string): boolean {
  return pathname !== '/overview'
    && pathname !== '/connect'
    && !pathname.startsWith('/chats');
}

export function deferTransportErrorToWorkspace({
  error,
  offline,
  pathname,
}: {
  error: unknown;
  offline: boolean;
  pathname: string;
}): boolean {
  return offline && hasCanonicalWorkspaceBanner(pathname) && isTransportError(error);
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
