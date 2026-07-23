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
  const limitValue = Number(searchParams.get('limit'));
  const limit = [25, 50, 100, 200].includes(limitValue) ? limitValue : 50;
  return {
    instanceId: searchParams.get('instanceId')?.trim() || undefined,
    resource: searchParams.get('resource')?.trim() || undefined,
    cursor: searchParams.get('cursor')?.trim() || undefined,
    limit,
  };
}
