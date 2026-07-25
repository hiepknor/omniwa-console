import { ApiFailure } from '@/api/envelopes';
import type { UiState } from '@/components/v2';

export function readFailureState(error: unknown, hasData = false): UiState {
  if (hasData) return { axis: 'resource', state: 'refresh-failed' };
  if (error instanceof ApiFailure) {
    if (error.category === 'authentication' || error.category === 'authorization') {
      return { axis: 'transport', state: 'authentication-failed' };
    }
    if (error.category === 'rate_limited') return { axis: 'transport', state: 'rate-limited' };
  }
  return { axis: 'transport', state: 'unreachable' };
}

export function commandFailureState(error: unknown): UiState {
  return error instanceof ApiFailure
    ? { axis: 'command', state: 'failed' }
    : { axis: 'command', state: 'uncertain' };
}

export function failureDetail(error: unknown): string {
  return error instanceof Error ? error.message : 'The request failed without a readable message.';
}

export function failureRequestId(error: unknown): string | undefined {
  return error instanceof ApiFailure ? error.requestId : undefined;
}
