import type { ReactNode } from 'react';
import { StateNotice } from './interaction';
import { ApiFailureNotice } from './ApiFailureNotice';

/**
 * Read wrapper for a paginated section or tab panel: shows the initial-loading
 * state while pending, a normalized failure with retry on error, and otherwise
 * renders the loaded children. Stale-capable reads that keep prior data visible
 * should compose `StateNotice`/`ApiFailureNotice` directly instead.
 */
export function PagedSection({ pending, error, retry, children }: { pending: boolean; error: unknown; retry: () => unknown; children: ReactNode }) {
  if (pending) return <StateNotice value={{ axis: 'resource', state: 'initial-loading' }} />;
  if (error) return <ApiFailureNotice error={error} onRetry={retry} />;
  return <>{children}</>;
}
