import { describe, expect, it } from 'vitest';
import type { InstanceResource } from '@/api/instances';
import { filterInstancesV2, instanceFiltersFromSearch } from './route-state';

const instances: InstanceResource[] = [
  { id: 'instance-sales', displayName: 'Sales desk', connected: true, status: 'connected' },
  { id: 'instance-support', displayName: 'Support', connected: false, status: 'disconnected' },
];

describe('Instances v2 route state', () => {
  it('preserves search and accepts only contract statuses', () => {
    expect(instanceFiltersFromSearch(new URLSearchParams('search=Sales&status=connected'))).toEqual({ search: 'Sales', status: 'connected' });
    expect(instanceFiltersFromSearch(new URLSearchParams('status=unknown'))).toEqual({ search: '', status: undefined });
  });

  it('filters loaded metadata by case-insensitive name, id, and status', () => {
    expect(filterInstancesV2(instances, { search: 'SALES' }).map((item) => item.id)).toEqual(['instance-sales']);
    expect(filterInstancesV2(instances, { search: 'instance', status: 'disconnected' }).map((item) => item.id)).toEqual(['instance-support']);
  });
});
