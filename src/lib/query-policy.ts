export const QUERY_INTERVALS = {
  campaign: 30_000,
  fleet: 15_000,
  platform: 30_000,
  projection: 60_000,
  qr: 20_000,
  mediaAsset: 2_000,
  mediaAssetBackoff: 5_000,
  mediaAssetLong: 10_000,
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

export const MEDIA_ASSET_READ_POLICY = {
  staleTime: 0,
  terminalStaleTime: Number.POSITIVE_INFINITY,
} as const;

export const FLEET_STALE_TIME = 10_000;
export const RECOVERY_STALE_TIME = 10_000;
export const CREDENTIAL_HEALTH_STALE_TIME = 60_000;

export function pollingWhen(enabled: boolean, interval: number): number | false {
  return enabled ? interval : false;
}

export function mediaAssetPollingInterval(status: string | undefined, updateCount: number): number | false {
  if (!status || ['ready', 'failed', 'deleted'].includes(status)) return false;
  if (updateCount < 5) return QUERY_INTERVALS.mediaAsset;
  if (updateCount < 10) return QUERY_INTERVALS.mediaAssetBackoff;
  return QUERY_INTERVALS.mediaAssetLong;
}
