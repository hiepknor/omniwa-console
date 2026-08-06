import { readOptionalSearchParam, readSearchText, updateSearchParams } from '@/lib/url-search-state';

export function contactsRouteState(searchParams: URLSearchParams) {
  return {
    search: readSearchText(searchParams, 'search').trim(),
    cursor: readOptionalSearchParam(searchParams, 'cursor'),
    panel: searchParams.get('panel') === 'labels' ? 'labels' as const : undefined,
    labelId: readOptionalSearchParam(searchParams, 'label'),
    labelSearch: readSearchText(searchParams, 'labelSearch').trim(),
  };
}

export function updateContactsParams(searchParams: URLSearchParams, updates: Record<string, string | undefined>, reset: string[] = []): URLSearchParams {
  return updateSearchParams(searchParams, updates, reset);
}
