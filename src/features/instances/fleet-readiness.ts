import type { KeyKind } from '@/lib/session';

export type FleetReadMode = 'scope-blocked' | 'discovering' | 'capability-error' | 'metadata' | 'compatibility';

export function fleetReadMode({
  keyKind,
  capabilitiesPending,
  capabilitiesError,
  capabilitiesAvailable,
  metadataAvailable,
}: {
  keyKind: KeyKind;
  capabilitiesPending: boolean;
  capabilitiesError: boolean;
  capabilitiesAvailable: boolean;
  metadataAvailable: boolean;
}): FleetReadMode {
  if (keyKind !== 'admin') return 'scope-blocked';
  if (capabilitiesPending && !capabilitiesAvailable) return 'discovering';
  if (capabilitiesError && !capabilitiesAvailable) return 'capability-error';
  return metadataAvailable ? 'metadata' : 'compatibility';
}
