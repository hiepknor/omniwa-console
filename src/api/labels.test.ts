import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { getLabel, listLabels } from './labels';

function ok(data: unknown) {
  return { data, response: new Response(null, { status: 200 }) };
}

describe('labels projection adapter', () => {
  it('normalizes the legacy bare-array list without inventing metadata', async () => {
    const GET = vi.fn().mockResolvedValue(ok([{
      id: 'database-id-that-must-not-own-identity',
      instance_id: 'instance-secret-scope',
      label_id: 'label-1',
      label_name: 'Priority',
      label_color: '3',
      predefined_id: '7',
      ProviderField: 'must-not-pass',
    }]));

    const result = await listLabels({ GET } as unknown as ApiClient);

    expect(GET).toHaveBeenCalledWith('/label/list');
    expect(result).toEqual({
      resource: [{ resourceType: 'label', id: 'label-1', name: 'Priority', color: '3', predefinedId: '7' }],
      meta: undefined,
    });
    expect(result.resource[0]).not.toHaveProperty('instance_id');
    expect(result.resource[0]).not.toHaveProperty('ProviderField');
  });

  it('preserves detail freshness and uses the requested stable identity as a safe fallback', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: { label_name: 'Customers', label_color: '4' },
      meta: { source: 'projection', syncStatus: 'stale', lastSyncedAt: '2026-07-22T08:00:00Z' },
    }));

    const result = await getLabel({ GET } as unknown as ApiClient, 'label-2');

    expect(GET).toHaveBeenCalledWith('/label/info/{labelId}', { params: { path: { labelId: 'label-2' } } });
    expect(result.resource).toEqual({ resourceType: 'label', id: 'label-2', name: 'Customers', color: '4', predefinedId: undefined });
    expect(result.meta?.syncStatus).toBe('stale');
  });

  it('drops malformed list rows without a stable label identity', async () => {
    const GET = vi.fn().mockResolvedValue(ok([{ label_name: 'Malformed' }, { label_id: 'label-3' }]));
    const result = await listLabels({ GET } as unknown as ApiClient);
    expect(result.resource.map((label) => label.id)).toEqual(['label-3']);
  });
});
