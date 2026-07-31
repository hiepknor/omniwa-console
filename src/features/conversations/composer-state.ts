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

export function composerNavigationBlock(state: ComposerInteractionState): ComposerNavigationBlock {
  if (state.pending) return 'pending';
  if (state.unknownOutcome) return 'unknown_outcome';
  if (state.dirty) return 'dirty';
  return undefined;
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
