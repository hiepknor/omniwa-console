import { readOptionalSearchParam, readSearchEnum, readSearchText, updateSearchParams } from '@/lib/url-search-state';

export type ConversationView = 'chats' | 'contacts' | 'labels';

export function conversationRouteState(searchParams: URLSearchParams) {
  return {
    view: readSearchEnum(searchParams, 'view', ['chats', 'contacts', 'labels'], 'chats') as ConversationView,
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
