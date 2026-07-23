import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { discardProjectionFailure, getProjectionFailures, replayProjectionFailure } from './recovery';

function ok(data: unknown) {
  return { data, response: new Response(null, { status: 200 }) };
}

describe('projection recovery API', () => {
  it('preserves opaque cursors and drops records without command identity', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: {
      items: [
        { eventKey: 'event-1', instanceId: 'instance-1', resource: 'messages', retryCount: 3 },
        { eventKey: '', instanceId: 'instance-2', resource: 'groups' },
      ],
      nextCursor: 'opaque:cursor',
    } }));
    const filters = { instanceId: 'instance-1', resource: 'messages', limit: 50, cursor: 'opaque:before' };
    await expect(getProjectionFailures({ GET } as unknown as ApiClient, filters)).resolves.toEqual({
      items: [expect.objectContaining({ eventKey: 'event-1', instanceId: 'instance-1', resource: 'messages', retryCount: 3 })],
      nextCursor: 'opaque:cursor',
    });
    expect(GET).toHaveBeenCalledWith('/server/projection-failures', { params: { query: filters } });
  });

  it.each([
    ['replay', replayProjectionFailure],
    ['discard', discardProjectionFailure],
  ] as const)('submits an audited %s command and preserves acknowledgement facts', async (action, command) => {
    const POST = vi.fn().mockResolvedValue(ok({ message: 'accepted', data: {
      action,
      eventKey: 'event-1',
      instanceId: 'instance-1',
      resource: 'messages',
      occurredAt: '2026-07-23T10:00:00Z',
    } }));
    const body = { eventKey: 'event-1', instanceId: 'instance-1', resource: 'messages', reason: 'Operator reviewed terminal failure' };
    await expect(command({ POST } as unknown as ApiClient, body)).resolves.toEqual(expect.objectContaining({ action, message: 'accepted' }));
    expect(POST).toHaveBeenCalledWith(`/server/projection-failures/${action}`, { body });
  });
});
