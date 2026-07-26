import { readOptionalSearchParam, readSearchText } from '@/lib/url-search-state';

export function groupRouteState(searchParams: URLSearchParams) {
  return {
    search: readSearchText(searchParams, 'search'),
    cursor: readOptionalSearchParam(searchParams, 'cursor'),
    create: searchParams.get('create') === '1',
  };
}
