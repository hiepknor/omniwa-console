import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { getContact, listContacts } from './contacts';

function ok(data: unknown) {
  return { data, response: new Response(null, { status: 200 }) };
}

const contact = {
  Jid: '100@s.whatsapp.net',
  Found: true,
  FullName: 'Ada Lovelace',
  PushName: 'Ada',
  PhoneJID: '100@s.whatsapp.net',
  LID: '123@lid',
  Username: 'ada',
  RedactedPhone: '+•••100',
  About: 'Analytical engine',
};

describe('contacts projection adapter', () => {
  it('normalizes the public contact model and preserves freshness', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: [contact],
      meta: { source: 'projection', syncStatus: 'stale', lastSyncedAt: '2026-07-22T08:00:00Z' },
    }));

    const result = await listContacts({ GET } as unknown as ApiClient);

    expect(GET).toHaveBeenCalledWith('/user/contacts');
    expect(result.resource.items).toEqual([expect.objectContaining({
      resourceType: 'contact',
      id: contact.Jid,
      displayName: 'Ada Lovelace',
      found: true,
      redactedPhone: '+•••100',
    })]);
    expect(result.meta?.syncStatus).toBe('stale');
  });

  it('passes a normalized prefix and opaque cursor through unchanged', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: [contact],
      meta: { source: 'projection', syncStatus: 'ready', nextCursor: 'opaque/next' },
    }));

    const result = await listContacts({ GET } as unknown as ApiClient, {
      search: '  Ada  ',
      cursor: 'opaque/current',
      limit: 25,
    });

    expect(GET).toHaveBeenCalledWith('/user/contacts/search', {
      params: { query: { q: 'Ada', cursor: 'opaque/current', limit: 25 } },
    });
    expect(result.resource.pagination).toEqual({ nextCursor: 'opaque/next', hasMore: true });
  });

  it('uses explicit display-name precedence without exposing unknown fields', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: { ...contact, FullName: '', PushName: 'Preferred push', SecretField: 'must-not-pass' },
      meta: { source: 'projection', syncStatus: 'ready' },
    }));

    const result = await getContact({ GET } as unknown as ApiClient, contact.Jid);

    expect(GET).toHaveBeenCalledWith('/user/contact/{contactId}', { params: { path: { contactId: contact.Jid } } });
    expect(result.resource.displayName).toBe('Preferred push');
    expect(result.resource).not.toHaveProperty('SecretField');
  });

  it('drops malformed list rows without a stable contact identity', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: [{ ...contact, Jid: '  ' }, contact],
      meta: { source: 'projection', syncStatus: 'ready' },
    }));

    const result = await listContacts({ GET } as unknown as ApiClient);

    expect(result.resource.items).toHaveLength(1);
    expect(result.resource.items[0]?.id).toBe(contact.Jid);
  });
});
