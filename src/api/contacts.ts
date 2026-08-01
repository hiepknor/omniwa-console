import type { ApiClient } from './client';
import { unwrapProjection, type ProjectionMeta } from './envelopes';
import type { components } from './generated/schema';

type ContactPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_user_service.ContactInfo'];

export type ContactResource = {
  resourceType: 'contact';
  id: string;
  addressingJid?: string;
  aliases: string[];
  identityStatus: 'complete' | 'partial' | 'legacy';
  identityUpdatedAt?: string;
  displayName?: string;
  displayNameSource?: 'full_name' | 'business_name' | 'push_name' | 'first_name' | 'username';
  found?: boolean;
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
  total?: number;
};

export type ContactReadResult<T> = { resource: T; meta?: ProjectionMeta };

function nonEmpty(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

function toContact(payload: ContactPayload, fallbackId = '', canonicalIdentity = false): ContactResource {
  const legacyId = nonEmpty(payload.Jid) ?? fallbackId;
  const canonicalId = canonicalIdentity ? nonEmpty(payload.contactId) : undefined;
  const id = canonicalId ?? legacyId;
  // A canonical record must never silently fall back to a legacy alias for
  // commands. Compatibility rows without a canonical ID may keep using Jid.
  const addressingJid = canonicalId ? nonEmpty(payload.addressingJid) : legacyId;
  const fullName = nonEmpty(payload.FullName);
  const pushName = nonEmpty(payload.PushName);
  const businessName = nonEmpty(payload.BusinessName);
  const firstName = nonEmpty(payload.FirstName);
  const username = nonEmpty(payload.Username);
  const redactedPhone = nonEmpty(payload.RedactedPhone);
  return {
    resourceType: 'contact',
    id,
    addressingJid,
    // Canonical aliases are backend-owned identity material. Preserve them
    // byte-for-byte so malformed whitespace cannot become an exact JID match.
    aliases: canonicalIdentity ? [...new Set(payload.aliases ?? [])] : [],
    identityStatus: canonicalId && payload.identityStatus ? payload.identityStatus : 'legacy',
    identityUpdatedAt: canonicalId ? nonEmpty(payload.identityUpdatedAt) : undefined,
    displayName: canonicalId
      ? nonEmpty(payload.displayName)
      : fullName ?? businessName ?? pushName ?? firstName ?? username ?? redactedPhone,
    displayNameSource: canonicalId ? payload.displayNameSource : undefined,
    found: payload.Found,
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

function normalizeContacts(payloads: ContactPayload[], canonicalIdentity: boolean): ContactResource[] {
  // Canonical identity is backend-owned. Never merge rows heuristically in the
  // browser; during mixed rollout, fall back to the legacy JID per row.
  return payloads.map((payload) => toContact(payload, '', canonicalIdentity)).filter((contact) => contact.id !== '');
}

export async function listContacts(
  client: ApiClient,
  params: { search?: string; cursor?: string; limit?: number; canonicalIdentity?: boolean } = {},
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
      items: normalizeContacts(projection.resource ?? [], params.canonicalIdentity ?? false),
      pagination: { nextCursor, hasMore: nextCursor !== null },
      total: projection.meta?.total,
    },
    meta: projection.meta,
  };
}

export async function getContact(
  client: ApiClient,
  contactId: string,
  canonicalIdentity = false,
): Promise<ContactReadResult<ContactResource>> {
  const projection = unwrapProjection<ContactPayload>(await client.GET('/user/contact/{contactId}', {
    params: { path: { contactId } },
  }));
  return { resource: toContact(projection.resource, contactId, canonicalIdentity), meta: projection.meta };
}
