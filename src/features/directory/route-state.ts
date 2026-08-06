import { omitSearchParams, readOptionalSearchParam, readSearchText, updateSearchParams, withSearchParams } from '@/lib/url-search-state';

const LABEL_PARAMS = ['panel', 'label', 'labelSearch'];

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

export function contactRegistryLocation(searchParams: URLSearchParams): string {
  return withSearchParams('/contacts', omitSearchParams(searchParams, LABEL_PARAMS));
}

export function labelCatalogLocation(searchParams: URLSearchParams): string {
  return withSearchParams('/contacts', updateSearchParams(searchParams, { panel: 'labels' }));
}
