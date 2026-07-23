import { readOptionalSearchParam, readSearchText, updateSearchParams } from '@/lib/url-search-state';

export function eventRouteState(searchParams: URLSearchParams) {
  return {
    type: readSearchText(searchParams, 'type').slice(0, 64),
    cursor: readOptionalSearchParam(searchParams, 'cursor'),
    event: readOptionalSearchParam(searchParams, 'event'),
  };
}

export function setEventParam(searchParams: URLSearchParams, key: string, value?: string) {
  return updateSearchParams(searchParams, { [key]: value }, key === 'type' ? ['cursor', 'event'] : []);
}
