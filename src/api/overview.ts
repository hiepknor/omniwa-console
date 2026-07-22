import type { ApiClient } from './client';
import type { components } from './generated/platform-schema';
import { NOT_IMPLEMENTED_READ, type CollectionEnvelope, type UnavailableRead } from './envelopes';

// omniwa-go exposes only `GET /server/ok`. Dashboard, metrics, and
// action-required have no backing, so the overview panel is stubbed.
type HealthResource = components['schemas']['HealthResource'];
type MetricsResource = components['schemas']['MetricsResource'];
type DashboardResource = components['schemas']['DashboardResource'];

export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };
export type ActionRequiredPagination = CollectionEnvelope['meta']['pagination'];

export async function getHealth(_client: ApiClient): Promise<ReadResult<HealthResource>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function getHealthReadiness(_client: ApiClient): Promise<ReadResult<HealthResource>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function getDashboardSummary(_client: ApiClient): Promise<ReadResult<DashboardResource>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function getQueueMetrics(_client: ApiClient): Promise<ReadResult<MetricsResource>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function getMessageMetrics(_client: ApiClient): Promise<ReadResult<MetricsResource>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function getWebhookMetrics(_client: ApiClient): Promise<ReadResult<MetricsResource>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function getMediaMetrics(_client: ApiClient): Promise<ReadResult<MetricsResource>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function listActionRequiredItems(
  _client: ApiClient,
): Promise<{ items: HealthResource[]; pagination?: ActionRequiredPagination; unavailable?: UnavailableRead }> {
  return { items: [], unavailable: NOT_IMPLEMENTED_READ };
}
