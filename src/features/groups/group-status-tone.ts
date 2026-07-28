import type { GroupState } from '@/api/groups';
import type { Tone } from '@/ui';

export function groupStatusTone(status: GroupState | undefined): Tone {
  if (status === 'active') return 'ok';
  if (status === 'suspended') return 'degraded';
  if (status === 'dissolved' || status === 'unavailable') return 'failed';
  return 'neutral';
}
