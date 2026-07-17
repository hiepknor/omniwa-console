import type { ApiClient } from './client';
import {
  ApiFailure,
  parseUnavailableRead,
  pickResource,
  pickResources,
  type CollectionEnvelope,
  type ErrorEnvelope,
  type UnavailableRead,
} from './envelopes';

export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };

function unavailableOrThrow(result: { error?: unknown; response: Response }): UnavailableRead {
  const unavailable = parseUnavailableRead(result.error);
  if (unavailable !== undefined) return unavailable;
  throw new ApiFailure(result.error as ErrorEnvelope | undefined, result.response.status);
}

export async function getHealth(client: ApiClient) {
  const result = await client.GET('/v1/health');
  if (result.data !== undefined) {
    return { resource: pickResource(result.data.data, 'health') };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function getHealthReadiness(client: ApiClient) {
  const result = await client.GET('/v1/health/readiness');
  if (result.data !== undefined) {
    return { resource: pickResource(result.data.data, 'health') };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function getDashboardSummary(client: ApiClient) {
  const result = await client.GET('/v1/dashboard');
  if (result.data !== undefined) {
    return { resource: pickResource(result.data.data, 'dashboard') };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function getQueueMetrics(client: ApiClient) {
  const result = await client.GET('/v1/metrics/queue');
  if (result.data !== undefined) {
    return { resource: pickResource(result.data.data, 'metrics') };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function getMessageMetrics(client: ApiClient) {
  const result = await client.GET('/v1/metrics/messages');
  if (result.data !== undefined) {
    return { resource: pickResource(result.data.data, 'metrics') };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function getWebhookMetrics(client: ApiClient) {
  const result = await client.GET('/v1/metrics/webhooks');
  if (result.data !== undefined) {
    return { resource: pickResource(result.data.data, 'metrics') };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function getMediaMetrics(client: ApiClient) {
  const result = await client.GET('/v1/metrics/media');
  if (result.data !== undefined) {
    return { resource: pickResource(result.data.data, 'metrics') };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function listActionRequiredItems(client: ApiClient) {
  const result = await client.GET('/v1/action-required', {
    params: { query: { limit: 20 } },
  });

  if (result.data === undefined) {
    const unavailable = unavailableOrThrow(result);
    return { items: [], pagination: undefined, unavailable };
  }

  return {
    items: pickResources(result.data.data, 'health'),
    pagination: result.data.meta.pagination,
  };
}

export type ActionRequiredPagination = CollectionEnvelope['meta']['pagination'];
