import type { InstanceResource, InstanceStatus } from '@/api/instances';

export type InstanceFiltersV2 = { search: string; status?: InstanceStatus };

export function instanceFiltersFromSearch(searchParams: URLSearchParams): InstanceFiltersV2 {
  const status = searchParams.get('status');
  return {
    search: searchParams.get('search') ?? '',
    status: status === 'connected' || status === 'disconnected' ? status : undefined,
  };
}

export function filterInstancesV2(instances: InstanceResource[], filters: InstanceFiltersV2): InstanceResource[] {
  const term = filters.search.trim().toLocaleLowerCase();
  return instances.filter((instance) => {
    const matchesSearch = !term
      || instance.id.toLocaleLowerCase().includes(term)
      || instance.displayName?.toLocaleLowerCase().includes(term);
    return Boolean(matchesSearch && (!filters.status || instance.status === filters.status));
  });
}
