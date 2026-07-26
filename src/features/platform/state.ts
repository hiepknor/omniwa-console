import { ApiFailure } from '@/api/envelopes';

export function failureDetail(error: unknown): string {
  return error instanceof Error ? error.message : 'The request failed without a readable message.';
}

export function failureRequestId(error: unknown): string | undefined {
  return error instanceof ApiFailure ? error.requestId : undefined;
}
