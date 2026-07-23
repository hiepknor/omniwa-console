import type { ApiClient } from './client';
import { unwrap } from './envelopes';
import type { components } from './generated/schema';

type CapabilitiesData = components['schemas']['apidocs.CapabilitiesData'];

export const capabilityNames = [
  'rate_limit_retry_after',
  'groups_projection',
  'labels_projection',
  'contacts_projection',
  'chats_projection',
  'messages_projection',
  'events_projection',
  'outbound_rate_limit',
  'campaign_orchestration',
  'projection_failure_operations',
  'instance_metadata_views',
  'instance_token_rotation',
  'instance_credential_health',
] as const;

export type CapabilityName = (typeof capabilityNames)[number];

export type CapabilitySnapshot = {
  version?: string;
  revision?: string;
  /** Unknown values are preserved so a newer server remains forward-compatible. */
  capabilities: readonly string[];
};

export async function getCapabilities(client: ApiClient): Promise<CapabilitySnapshot> {
  const data = unwrap<CapabilitiesData>(await client.GET('/server/capabilities'));
  return {
    version: data?.version || undefined,
    revision: data?.revision || undefined,
    capabilities: [...new Set(data?.capabilities ?? [])].sort(),
  };
}

export function hasCapability(
  snapshot: CapabilitySnapshot | undefined,
  capability: CapabilityName,
): boolean {
  return snapshot?.capabilities.includes(capability) ?? false;
}
