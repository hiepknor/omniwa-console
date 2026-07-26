import { readOptionalSearchParam, readSearchNumber } from '@/lib/url-search-state';

export const overviewWindowOptions = [
  { value: '1h', label: 'Last hour' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '168h', label: 'Last 7 days' },
  { value: '720h', label: 'Last 30 days' },
] as const;

export function overviewWindowFromSearch(value: string | null): string {
  return overviewWindowOptions.find((option) => option.value === value)?.value ?? '24h';
}

export function recoveryFiltersFromSearch(searchParams: URLSearchParams) {
  return {
    instanceId: readOptionalSearchParam(searchParams, 'instanceId'),
    resource: readOptionalSearchParam(searchParams, 'resource'),
    cursor: readOptionalSearchParam(searchParams, 'cursor'),
    limit: readSearchNumber(searchParams, 'limit', [25, 50, 100, 200], 50),
  };
}
