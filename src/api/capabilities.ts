import type { ApiClient } from './client';
import { unwrap } from './envelopes';
import type { components } from './generated/schema';

type CapabilitiesData = components['schemas']['apidocs.CapabilitiesData'];

export const capabilityNames = [
  'rate_limit_retry_after',
  'groups_projection',
  'group_management_permissions',
  'group_members_projection',
  'group_management_commands',
  'group_management_audit',
  'group_photo_assets',
  'group_summary',
  'labels_projection',
  'contacts_projection',
  'canonical_contact_identity',
  'canonical_conversation_identity',
  'authoritative_conversation_unread',
  'messages_projection',
  'conversation_media_assets',
  'events_projection',
  'outbound_rate_limit',
  'campaign_orchestration',
  'group_lists',
  'campaign_group_targets',
  'projection_failure_operations',
  'instance_metadata_views',
  'instance_token_rotation',
  'instance_credential_health',
] as const;

export type CapabilityName = (typeof capabilityNames)[number];

export type CapabilityCredentialScope = 'admin' | 'instance';

export type CapabilitySnapshot = {
  version?: string;
  revision?: string;
  /** Absent only on older backend revisions that predate explicit discovery. */
  credentialScope?: CapabilityCredentialScope;
  /** Supplied by the backend only for an instance credential. */
  instanceId?: string;
  /** Unknown values are preserved so a newer server remains forward-compatible. */
  capabilities: readonly string[];
};

export async function getCapabilities(client: ApiClient, signal?: AbortSignal): Promise<CapabilitySnapshot> {
  const data = unwrap<CapabilitiesData>(await client.GET('/server/capabilities', { signal }));
  return {
    version: data?.version || undefined,
    revision: data?.revision || undefined,
    ...(data?.credentialScope ? { credentialScope: data.credentialScope } : {}),
    ...(data?.credentialScope === 'instance' && data.instanceId ? { instanceId: data.instanceId } : {}),
    capabilities: [...new Set(data?.capabilities ?? [])].sort(),
  };
}

export function hasCapability(
  snapshot: CapabilitySnapshot | undefined,
  capability: CapabilityName,
): boolean {
  return snapshot?.capabilities.includes(capability) ?? false;
}
