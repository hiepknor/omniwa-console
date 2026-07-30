import { readOptionalSearchParam, readSearchEnum, readSearchText, updateSearchParams } from '@/lib/url-search-state';

export type ConversationView = 'conversations' | 'contacts' | 'labels';

export function conversationRouteState(searchParams: URLSearchParams) {
  return {
    view: readSearchEnum(searchParams, 'view', ['conversations', 'contacts', 'labels'], 'conversations') as ConversationView,
    search: readSearchText(searchParams, 'search'),
    cursor: readOptionalSearchParam(searchParams, 'cursor'),
    messageCursor: readOptionalSearchParam(searchParams, 'messageCursor'),
    selected: readOptionalSearchParam(searchParams, 'selected'),
    message: readOptionalSearchParam(searchParams, 'message'),
  };
}

export function setConversationParam(searchParams: URLSearchParams, key: string, value?: string): URLSearchParams {
  return updateSearchParams(searchParams, { [key]: value });
}
