import { ApiFailure } from '@/api/envelopes';

export function shouldInvalidateSession(error: unknown): boolean {
  return error instanceof ApiFailure
    && error.category === 'authentication'
    && error.credentialScope === 'session';
}
