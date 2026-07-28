import { describe, expect, it } from 'vitest';
import type { InstanceResource } from '@/api/instances';
import { filterInstances, instanceFiltersFromSearch } from './route-state';

const instances: InstanceResource[] = [
  { id: 'instance-sales', displayName: 'Sales desk', connected: true, status: 'connected' },
  { id: 'instance-support', displayName: 'Support', connected: false, status: 'disconnected' },
  { id: 'instance-unknown', displayName: 'Migrating', status: 'unknown' },
];

describe('Instances route state', () => {
  it('preserves search and accepts only contract statuses', () => {
    expect(instanceFiltersFromSearch(new URLSearchParams('search=Sales&status=connected'))).toEqual({ search: 'Sales', status: 'connected' });
    expect(instanceFiltersFromSearch(new URLSearchParams('status=unknown'))).toEqual({ search: '', status: 'unknown' });
    expect(instanceFiltersFromSearch(new URLSearchParams('status=broken'))).toEqual({ search: '', status: undefined });
  });

  it('filters loaded metadata by case-insensitive name, id, and status', () => {
    expect(filterInstances(instances, { search: 'SALES' }).map((item) => item.id)).toEqual(['instance-sales']);
    expect(filterInstances(instances, { search: 'instance', status: 'disconnected' }).map((item) => item.id)).toEqual(['instance-support']);
    expect(filterInstances(instances, { search: '', status: 'unknown' }).map((item) => item.id)).toEqual(['instance-unknown']);
  });
});
