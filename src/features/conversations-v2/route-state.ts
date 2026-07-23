export type ConversationViewV2 = 'chats' | 'contacts' | 'labels';

export function conversationRouteState(searchParams: URLSearchParams) {
  const viewValue = searchParams.get('view');
  const view: ConversationViewV2 = viewValue === 'contacts' || viewValue === 'labels' ? viewValue : 'chats';
  return {
    view,
    search: searchParams.get('search') ?? '',
    cursor: searchParams.get('cursor')?.trim() || undefined,
    messageCursor: searchParams.get('messageCursor')?.trim() || undefined,
    selected: searchParams.get('selected')?.trim() || undefined,
    message: searchParams.get('message')?.trim() || undefined,
  };
}

export function setConversationParam(searchParams: URLSearchParams, key: string, value?: string): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  if (value) next.set(key, value); else next.delete(key);
  return next;
}
