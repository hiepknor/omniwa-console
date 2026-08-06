import { omitSearchParams, readOptionalSearchParam, readSearchEnum, readSearchText, updateSearchParams, withSearchParams } from '@/lib/url-search-state';

export function conversationRouteState(searchParams: URLSearchParams) {
  return {
    search: readSearchText(searchParams, 'search'),
    cursor: readOptionalSearchParam(searchParams, 'cursor'),
    messageCursor: readOptionalSearchParam(searchParams, 'messageCursor'),
    message: readOptionalSearchParam(searchParams, 'message'),
    details: searchParams.get('details') === 'conversation' ? 'conversation' as const : undefined,
  };
}

export function legacyDirectoryTarget(searchParams: URLSearchParams): string | undefined {
  const view = readSearchEnum(searchParams, 'view', ['contacts', 'labels', 'none'] as const, 'none');
  if (view !== 'contacts' && view !== 'labels') return undefined;
  const selected = readOptionalSearchParam(searchParams, 'selected');
  const next = omitSearchParams(searchParams, ['view', 'selected', 'message', 'messageCursor', 'details', ...(view === 'labels' ? ['cursor'] : [])]);
  if (view === 'labels') {
    next.set('panel', 'labels');
    if (selected) next.set('label', selected);
    const search = next.get('search');
    if (search) next.set('labelSearch', search);
    next.delete('search');
    return withSearchParams('/contacts', next);
  }
  return withSearchParams(selected ? `/contacts/${encodeURIComponent(selected)}` : '/contacts', next);
}

export function setConversationParam(searchParams: URLSearchParams, key: string, value?: string): URLSearchParams {
  return updateSearchParams(searchParams, { [key]: value });
}
