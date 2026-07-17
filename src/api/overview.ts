import type { ApiClient } from './client';
import {
  pickResource,
  pickResources,
  unwrap,
  type CollectionEnvelope,
} from './envelopes';

export async function getHealth(client: ApiClient) {
  const envelope = unwrap(await client.GET('/v1/health'));
  return pickResource(envelope.data, 'health');
}

export async function getHealthReadiness(client: ApiClient) {
  const envelope = unwrap(await client.GET('/v1/health/readiness'));
  return pickResource(envelope.data, 'health');
}

export async function getDashboardSummary(client: ApiClient) {
  const envelope = unwrap(await client.GET('/v1/dashboard'));
  return pickResource(envelope.data, 'dashboard');
}

export async function getQueueMetrics(client: ApiClient) {
  const envelope = unwrap(await client.GET('/v1/metrics/queue'));
  return pickResource(envelope.data, 'metrics');
}

export async function getMessageMetrics(client: ApiClient) {
  const envelope = unwrap(await client.GET('/v1/metrics/messages'));
  return pickResource(envelope.data, 'metrics');
}

export async function getWebhookMetrics(client: ApiClient) {
  const envelope = unwrap(await client.GET('/v1/metrics/webhooks'));
  return pickResource(envelope.data, 'metrics');
}

export async function getMediaMetrics(client: ApiClient) {
  const envelope = unwrap(await client.GET('/v1/metrics/media'));
  return pickResource(envelope.data, 'metrics');
}

export async function listActionRequiredItems(client: ApiClient) {
  const envelope = unwrap(
    await client.GET('/v1/action-required', {
      params: { query: { limit: 20 } },
    }),
  );

  return {
    items: pickResources(envelope.data, 'health'),
    pagination: envelope.meta.pagination,
  };
}

export type ActionRequiredPagination = CollectionEnvelope['meta']['pagination'];
