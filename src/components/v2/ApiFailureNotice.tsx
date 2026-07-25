import { ApiFailure } from '@/api/envelopes';
import { Button } from './primitives';
import { StateNotice } from './interaction';

export function ApiFailureNotice({ error, stale = false, onRetry, command = false }: { error: unknown; stale?: boolean; onRetry?: () => void; command?: boolean }) {
  const failure = error instanceof ApiFailure ? error : undefined;
  const rateLimited = failure?.category === 'rate_limited';
  const value = command
    ? failure ? { axis: 'command' as const, state: 'failed' as const } : { axis: 'command' as const, state: 'uncertain' as const }
    : stale ? { axis: 'resource' as const, state: 'refresh-failed' as const }
    : failure?.category === 'authentication' || failure?.category === 'authorization' ? { axis: 'transport' as const, state: 'authentication-failed' as const }
    : rateLimited ? { axis: 'transport' as const, state: 'rate-limited' as const }
    : { axis: 'transport' as const, state: 'unreachable' as const };
  const identity = failure ? `${failure.code ?? failure.category}: ` : '';
  const cooldown = rateLimited && failure?.retryAfterSeconds !== undefined ? ` Retry after ${failure.retryAfterSeconds} seconds.` : '';
  return <StateNotice value={value} detail={`${identity}${error instanceof Error ? error.message : 'Request failed.'}${cooldown}${rateLimited ? ' Automatic retries are disabled.' : ''}`} requestId={failure?.requestId} action={onRetry && !rateLimited && !command ? <Button onClick={onRetry}>Retry read</Button> : undefined} />;
}
