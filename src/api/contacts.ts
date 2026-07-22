import type { ApiClient } from './client';
import { unwrapProjection, type ProjectionMeta } from './envelopes';
import type { components } from './generated/schema';

type ContactPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_user_service.ContactInfo'];

export type ContactResource = {
  resourceType: 'contact';
  id: string;
  displayName?: string;
  found: boolean;
  firstName?: string;
  fullName?: string;
  pushName?: string;
  businessName?: string;
  phoneJid?: string;
  lid?: string;
  username?: string;
  redactedPhone?: string;
  pictureId?: string;
  pictureRemoved?: boolean;
  pictureUpdatedAt?: string;
  about?: string;
  aboutUpdatedAt?: string;
};

export type ContactPage = {
  items: ContactResource[];
  pagination: { nextCursor: string | null; hasMore: boolean };
};

export type ContactReadResult<T> = { resource: T; meta?: ProjectionMeta };

function nonEmpty(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

function toContact(payload: ContactPayload, fallbackId = ''): ContactResource {
  const id = nonEmpty(payload.Jid) ?? fallbackId;
  const fullName = nonEmpty(payload.FullName);
  const pushName = nonEmpty(payload.PushName);
  const businessName = nonEmpty(payload.BusinessName);
  const firstName = nonEmpty(payload.FirstName);
  const username = nonEmpty(payload.Username);
  const redactedPhone = nonEmpty(payload.RedactedPhone);
  return {
    resourceType: 'contact',
    id,
    displayName: fullName ?? pushName ?? businessName ?? firstName ?? username ?? redactedPhone ?? id,
    found: payload.Found ?? false,
    firstName,
    fullName,
    pushName,
    businessName,
    phoneJid: nonEmpty(payload.PhoneJID),
    lid: nonEmpty(payload.LID),
    username,
    redactedPhone,
    pictureId: nonEmpty(payload.PictureID),
    pictureRemoved: payload.PictureRemoved,
    pictureUpdatedAt: nonEmpty(payload.PictureUpdatedAt),
    about: nonEmpty(payload.About),
    aboutUpdatedAt: nonEmpty(payload.AboutUpdatedAt),
  };
}

function normalizeContacts(payloads: ContactPayload[]): ContactResource[] {
  // A stable JID is the instance-scoped projection identity. Ignore malformed
  // rows instead of introducing duplicate empty React/query identities.
  return payloads.map((payload) => toContact(payload)).filter((contact) => contact.id !== '');
}

export async function listContacts(
  client: ApiClient,
  params: { search?: string; cursor?: string; limit?: number } = {},
): Promise<ContactReadResult<ContactPage>> {
  const search = params.search?.trim() ?? '';
  const result = search || params.cursor
    ? await client.GET('/user/contacts/search', {
      params: { query: { q: search, limit: params.limit ?? 50, cursor: params.cursor } },
    })
    : await client.GET('/user/contacts');
  const projection = unwrapProjection<ContactPayload[]>(result);
  const nextCursor = projection.meta?.nextCursor ?? null;
  return {
    resource: {
      items: normalizeContacts(projection.resource ?? []),
      pagination: { nextCursor, hasMore: nextCursor !== null },
    },
    meta: projection.meta,
  };
}

export async function getContact(
  client: ApiClient,
  contactId: string,
): Promise<ContactReadResult<ContactResource>> {
  const projection = unwrapProjection<ContactPayload>(await client.GET('/user/contact/{contactId}', {
    params: { path: { contactId } },
  }));
  return { resource: toContact(projection.resource, contactId), meta: projection.meta };
}
