import { describe, expect, it } from 'vitest';
import {
  CAMPAIGN_READ_POLICY,
  CREDENTIAL_HEALTH_STALE_TIME,
  FLEET_STALE_TIME,
  MEDIA_ASSET_READ_POLICY,
  mediaAssetPollingInterval,
  PLATFORM_READ_POLICY,
  pollingWhen,
  PROJECTION_READ_POLICY,
  QUERY_INTERVALS,
  RECOVERY_STALE_TIME,
} from './query-policy';

describe('query policy', () => {
  it('keeps bounded read cadences explicit by resource class', () => {
    expect(CAMPAIGN_READ_POLICY).toEqual({ staleTime: 15_000, refetchInterval: 30_000 });
    expect(PLATFORM_READ_POLICY).toEqual({ staleTime: 15_000, refetchInterval: 30_000 });
    expect(PROJECTION_READ_POLICY).toEqual({ staleTime: 30_000, refetchInterval: 60_000 });
    expect(MEDIA_ASSET_READ_POLICY).toEqual({ staleTime: 0, terminalStaleTime: Number.POSITIVE_INFINITY });
    expect(FLEET_STALE_TIME).toBe(10_000);
    expect(RECOVERY_STALE_TIME).toBe(10_000);
    expect(CREDENTIAL_HEALTH_STALE_TIME).toBe(60_000);
    expect(QUERY_INTERVALS.qr).toBe(20_000);
  });

  it('disables polling when its route or scoped resource is inactive', () => {
    expect(pollingWhen(false, QUERY_INTERVALS.projection)).toBe(false);
    expect(pollingWhen(true, QUERY_INTERVALS.projection)).toBe(60_000);
  });
});

describe('media asset polling policy', () => {
  it('backs off while an asset remains non-terminal', () => {
    expect(mediaAssetPollingInterval('processing', 0)).toBe(QUERY_INTERVALS.mediaAsset);
    expect(mediaAssetPollingInterval('processing', 5)).toBe(QUERY_INTERVALS.mediaAssetBackoff);
    expect(mediaAssetPollingInterval('processing', 10)).toBe(QUERY_INTERVALS.mediaAssetLong);
  });

  it('stops for terminal or unreported states', () => {
    expect(mediaAssetPollingInterval('ready', 2)).toBe(false);
    expect(mediaAssetPollingInterval('failed', 2)).toBe(false);
    expect(mediaAssetPollingInterval('deleted', 2)).toBe(false);
    expect(mediaAssetPollingInterval(undefined, 2)).toBe(false);
  });
});
