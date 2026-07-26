import type { CampaignStatus } from '@/api/campaigns';

export type CampaignAction = 'schedule' | 'start' | 'pause' | 'resume' | 'abort';

export const campaignActions = {
  draft: ['schedule', 'start', 'abort'],
  scheduled: ['start', 'abort'],
  running: ['pause', 'abort'],
  paused: ['resume', 'abort'],
  completed: [],
  aborted: [],
  failed: [],
} as const satisfies Record<CampaignStatus, readonly CampaignAction[]>;
