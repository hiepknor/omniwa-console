import { useEffect, useRef } from 'react';
import { ApiFailure } from '@/api/envelopes';
import { cursorRecoveryAction } from './cursor-recovery';

export function useInvalidCursorReset(error: unknown, cursor: string | undefined, onReset: () => void) {
  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;

  useEffect(() => {
    if (!(error instanceof ApiFailure) || cursorRecoveryAction(error.code, cursor) !== 'reset') return;
    onResetRef.current();
  }, [cursor, error]);
}
