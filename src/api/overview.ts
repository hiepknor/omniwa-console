import type { ApiClient } from './client';
import type { components } from './generated/platform-schema';
import { notImplemented, type CollectionEnvelope, type UnavailableRead } from './envelopes';

// omniwa-go exposes only `GET /server/ok`. Dashboard, metrics, and
// action-required have no backing, so the overview panel is stubbed.
type HealthResource = components['schemas']['HealthResource'];
type MetricsResource = components['schemas']['MetricsResource'];
type DashboardResource = components['schemas']['DashboardResource'];

export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };
export type ActionRequiredPagination = CollectionEnvelope['meta']['pagination'];

export async function getHealth(_client: ApiClient): Promise<ReadResult<HealthResource>> {
  throw notImplemented('Health');
}

export async function getHealthReadiness(_client: ApiClient): Promise<ReadResult<HealthResource>> {
  throw notImplemented('Health readiness');
}

export async function getDashboardSummary(_client: ApiClient): Promise<ReadResult<DashboardResource>> {
  throw notImplemented('Dashboard');
}

export async function getQueueMetrics(_client: ApiClient): Promise<ReadResult<MetricsResource>> {
  throw notImplemented('Queue metrics');
}

export async function getMessageMetrics(_client: ApiClient): Promise<ReadResult<MetricsResource>> {
  throw notImplemented('Message metrics');
}

export async function getWebhookMetrics(_client: ApiClient): Promise<ReadResult<MetricsResource>> {
  throw notImplemented('Webhook metrics');
}

export async function getMediaMetrics(_client: ApiClient): Promise<ReadResult<MetricsResource>> {
  throw notImplemented('Media metrics');
}

export async function listActionRequiredItems(
  _client: ApiClient,
): Promise<{ items: HealthResource[]; pagination?: ActionRequiredPagination; unavailable?: UnavailableRead }> {
  throw notImplemented('Action required');
}
