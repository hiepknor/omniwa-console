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
          credentialScope: 'instance',
          instanceId: '0bca2c34-ef2a-463c-98fd-e2afb6978457',
          capabilities: ['groups_projection', 'canonical_contact_identity', 'canonical_conversation_identity', 'authoritative_conversation_unread', 'conversation_media_assets', 'future_projection', 'groups_projection'],
        },
      },
      response: new Response(null, { status: 200 }),
    });
    const snapshot = await getCapabilities({ GET } as unknown as ApiClient);
    expect(snapshot).toEqual({
      version: '1.2.3',
      revision: 'abcdef1234567890',
      credentialScope: 'instance',
      instanceId: '0bca2c34-ef2a-463c-98fd-e2afb6978457',
      capabilities: ['authoritative_conversation_unread', 'canonical_contact_identity', 'canonical_conversation_identity', 'conversation_media_assets', 'future_projection', 'groups_projection'],
    });
    expect(hasCapability(snapshot, 'groups_projection')).toBe(true);
    expect(hasCapability(snapshot, 'canonical_conversation_identity')).toBe(true);
    expect(hasCapability(snapshot, 'authoritative_conversation_unread')).toBe(true);
    expect(hasCapability(snapshot, 'messages_projection')).toBe(false);
  });
});
