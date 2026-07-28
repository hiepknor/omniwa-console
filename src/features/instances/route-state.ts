import type { InstanceResource, InstanceStatus } from '@/api/instances';
import { readSearchEnum, readSearchText } from '@/lib/url-search-state';

export type InstanceFilters = { search: string; status?: InstanceStatus };

export function instanceFiltersFromSearch(searchParams: URLSearchParams): InstanceFilters {
  return {
    search: readSearchText(searchParams, 'search'),
    status: readSearchEnum(searchParams, 'status', ['', 'connected', 'disconnected', 'unknown'], '') || undefined,
  };
}

export function filterInstances(instances: InstanceResource[], filters: InstanceFilters): InstanceResource[] {
  const term = filters.search.trim().toLocaleLowerCase();
  return instances.filter((instance) => {
    const matchesSearch = !term
      || instance.id.toLocaleLowerCase().includes(term)
      || instance.displayName?.toLocaleLowerCase().includes(term);
    return Boolean(matchesSearch && (!filters.status || instance.status === filters.status));
  });
}
