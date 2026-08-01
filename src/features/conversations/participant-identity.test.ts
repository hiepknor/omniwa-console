import { describe, expect, it } from 'vitest';
import type { ContactResource } from '@/api/contacts';
import { buildParticipantDisplayIndex, participantIdentityReadsEnabled, resolveParticipantDisplay } from './participant-identity';

function contact(overrides: Partial<ContactResource> = {}): ContactResource {
  return {
    resourceType: 'contact',
    id: 'contact-1',
    aliases: ['15551230001@s.whatsapp.net', '731002@lid'],
    addressingJid: 'command-target@lid',
    phoneJid: 'compatibility-phone@s.whatsapp.net',
    lid: 'compatibility-lid@lid',
    identityStatus: 'complete',
    displayName: 'Anna Nguyen',
    ...overrides,
  };
}

describe('canonical Group participant display resolution', () => {
  it('loads identity data only for Group Conversations with both independent Contact capabilities', () => {
    expect(participantIdentityReadsEnabled('group', ['contacts_projection', 'canonical_contact_identity'])).toBe(true);
    expect(participantIdentityReadsEnabled('group', ['contacts_projection'])).toBe(false);
    expect(participantIdentityReadsEnabled('group', ['canonical_contact_identity'])).toBe(false);
    expect(participantIdentityReadsEnabled('direct', ['contacts_projection', 'canonical_contact_identity'])).toBe(false);
    expect(participantIdentityReadsEnabled('newsletter', ['contacts_projection', 'canonical_contact_identity'])).toBe(false);
    expect(participantIdentityReadsEnabled('broadcast', ['contacts_projection', 'canonical_contact_identity'])).toBe(false);
  });

  it('resolves exact PN and LID aliases to the same canonical Contact display name', () => {
    const index = buildParticipantDisplayIndex([contact()]);

    expect(resolveParticipantDisplay('15551230001@s.whatsapp.net', index)).toBe('Anna Nguyen');
    expect(resolveParticipantDisplay('731002@lid', index)).toBe('Anna Nguyen');
  });

  it('keeps an unknown participant unresolved without exposing its raw JID', () => {
    const index = buildParticipantDisplayIndex([contact()]);

    expect(resolveParticipantDisplay('999999@lid', index)).toBeUndefined();
    expect(resolveParticipantDisplay(undefined, index)).toBeUndefined();
  });

  it('does not match display names, formatted phones, suffixes, whitespace, addressing targets, or provider compatibility fields', () => {
    const index = buildParticipantDisplayIndex([contact()]);

    for (const candidate of [
      'Anna Nguyen',
      '+1 555 123 0001',
      '230001@s.whatsapp.net',
      ' 731002@lid ',
      'command-target@lid',
      'compatibility-phone@s.whatsapp.net',
      'compatibility-lid@lid',
    ]) {
      expect(resolveParticipantDisplay(candidate, index)).toBeUndefined();
    }
  });

  it('fails closed when two canonical Contacts claim the same alias', () => {
    const index = buildParticipantDisplayIndex([
      contact(),
      contact({ id: 'contact-2', aliases: ['731002@lid'], displayName: 'Conflicting identity' }),
    ]);

    expect(resolveParticipantDisplay('731002@lid', index)).toBeUndefined();
    expect(resolveParticipantDisplay('15551230001@s.whatsapp.net', index)).toBe('Anna Nguyen');
  });

  it('does not manufacture a label for an authoritative Contact without a display name', () => {
    const index = buildParticipantDisplayIndex([contact({ displayName: undefined })]);

    expect(resolveParticipantDisplay('731002@lid', index)).toBeUndefined();
  });
});
