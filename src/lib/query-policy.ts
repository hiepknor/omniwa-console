export const QUERY_INTERVALS = {
  campaign: 30_000,
  fleet: 15_000,
  platform: 30_000,
  projection: 60_000,
  qr: 20_000,
} as const;

export const CAMPAIGN_READ_POLICY = {
  staleTime: 15_000,
  refetchInterval: QUERY_INTERVALS.campaign,
} as const;

export const PLATFORM_READ_POLICY = {
  staleTime: 15_000,
  refetchInterval: QUERY_INTERVALS.platform,
} as const;

export const PROJECTION_READ_POLICY = {
  staleTime: 30_000,
  refetchInterval: QUERY_INTERVALS.projection,
} as const;

export const FLEET_STALE_TIME = 10_000;
export const RECOVERY_STALE_TIME = 10_000;
export const CREDENTIAL_HEALTH_STALE_TIME = 60_000;

export function pollingWhen(enabled: boolean, interval: number): number | false {
  return enabled ? interval : false;
}
