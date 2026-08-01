import type { ContactResource } from '@/api/contacts';

export type ParticipantDisplayIndex = ReadonlyMap<string, string>;

export function participantIdentityReadsEnabled(
  conversationType: string | undefined,
  capabilities: readonly string[],
): boolean {
  return conversationType === 'group'
    && capabilities.includes('contacts_projection')
    && capabilities.includes('canonical_contact_identity');
}

/**
 * Build an exact canonical-Contact alias lookup for Group participant labels.
 * Ambiguous aliases and contacts without a backend-projected display name stay
 * unresolved; provider addressing and compatibility fields are never identity.
 */
export function buildParticipantDisplayIndex(
  contacts: readonly ContactResource[],
): ParticipantDisplayIndex {
  const claims = new Map<string, { contactId: string; displayName?: string }>();
  const ambiguous = new Set<string>();

  for (const contact of contacts) {
    for (const alias of contact.aliases) {
      const existing = claims.get(alias);
      if (existing && existing.contactId !== contact.id) {
        ambiguous.add(alias);
        continue;
      }
      claims.set(alias, { contactId: contact.id, displayName: contact.displayName });
    }
  }

  return new Map([...claims].flatMap(([alias, claim]) => (
    !ambiguous.has(alias) && claim.displayName !== undefined
      ? [[alias, claim.displayName] as const]
      : []
  )));
}

export function resolveParticipantDisplay(
  participantJid: string | undefined,
  index: ParticipantDisplayIndex,
): string | undefined {
  return participantJid === undefined ? undefined : index.get(participantJid);
}
