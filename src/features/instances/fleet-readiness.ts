import type { KeyKind } from '@/lib/session';

export type FleetReadMode = 'scope-blocked' | 'discovering' | 'capability-error' | 'metadata' | 'compatibility';

export function fleetReadMode({
  keyKind,
  capabilitiesPending,
  capabilitiesError,
  metadataAvailable,
}: {
  keyKind: KeyKind;
  capabilitiesPending: boolean;
  capabilitiesError: boolean;
  metadataAvailable: boolean;
}): FleetReadMode {
  if (keyKind !== 'admin') return 'scope-blocked';
  if (capabilitiesPending) return 'discovering';
  if (capabilitiesError) return 'capability-error';
  return metadataAvailable ? 'metadata' : 'compatibility';
}
