export type CursorRecoveryAction = 'reset' | 'retry';

export function cursorRecoveryAction(errorCode: string | undefined, cursor: string | undefined): CursorRecoveryAction {
  return errorCode === 'invalid_cursor' && cursor ? 'reset' : 'retry';
}
