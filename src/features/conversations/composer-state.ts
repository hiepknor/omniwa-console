export type ComposerInteractionState = {
  dirty: boolean;
  pending: boolean;
  unknownOutcome: boolean;
};

export const IDLE_COMPOSER_STATE: ComposerInteractionState = {
  dirty: false,
  pending: false,
  unknownOutcome: false,
};

export type ComposerNavigationBlock = 'pending' | 'unknown_outcome' | 'dirty' | undefined;
export type ComposerBlockerResolution =
  | { action: 'none' }
  | { action: 'reset' }
  | { action: 'show'; reason: Exclude<ComposerNavigationBlock, undefined> };

export function composerNavigationBlock(state: ComposerInteractionState): ComposerNavigationBlock {
  if (state.pending) return 'pending';
  if (state.unknownOutcome) return 'unknown_outcome';
  if (state.dirty) return 'dirty';
  return undefined;
}

export function resolveComposerBlocker(blockerState: 'blocked' | 'proceeding' | 'unblocked', state: ComposerInteractionState): ComposerBlockerResolution {
  if (blockerState !== 'blocked') return { action: 'none' };
  const reason = composerNavigationBlock(state);
  return reason ? { action: 'show', reason } : { action: 'reset' };
}

function conversationRefFromPath(pathname: string): string | undefined {
  const match = pathname.match(/^\/conversations\/([^/]+)$/);
  if (!match?.[1]) return undefined;
  try { return decodeURIComponent(match[1]); } catch { return match[1]; }
}

export function shouldBlockConversationNavigation({ currentPath, nextPath, canonicalConversationId, state }: {
  currentPath: string;
  nextPath: string;
  canonicalConversationId?: string;
  state: ComposerInteractionState;
}): boolean {
  if (!composerNavigationBlock(state)) return false;
  const currentRef = conversationRefFromPath(currentPath);
  const nextRef = conversationRefFromPath(nextPath);
  if (currentRef === nextRef) return false;
  return !(canonicalConversationId && nextRef === canonicalConversationId);
}
