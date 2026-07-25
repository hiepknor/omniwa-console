import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { getCapabilities, hasCapability } from './capabilities';

describe('capabilities', () => {
  it('normalizes duplicate capability values without discarding unknown additions', async () => {
    const GET = vi.fn().mockResolvedValue({
      data: {
        message: 'success',
        data: {
          version: '1.2.3',
          revision: 'abcdef1234567890',
          capabilities: ['groups_projection', 'future_projection', 'groups_projection'],
        },
      },
      response: new Response(null, { status: 200 }),
    });
    const snapshot = await getCapabilities({ GET } as unknown as ApiClient);
    expect(snapshot).toEqual({
      version: '1.2.3',
      revision: 'abcdef1234567890',
      capabilities: ['future_projection', 'groups_projection'],
    });
    expect(hasCapability(snapshot, 'groups_projection')).toBe(true);
    expect(hasCapability(snapshot, 'messages_projection')).toBe(false);
  });
});
