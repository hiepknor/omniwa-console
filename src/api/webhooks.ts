import type { ApiClient } from './client';
import type { components } from './generated/schema';
import {
  ApiFailure,
  parseUnavailableRead,
  pickResource,
  pickResources,
  unwrap,
  type CollectionEnvelope,
  type ErrorEnvelope,
  type PublicData,
  type UnavailableRead,
} from './envelopes';

export type WebhookResource = components['schemas']['WebhookResource'];
export type WebhookDeliveryResource = components['schemas']['WebhookDeliveryResource'];
export type WebhookRequest = components['schemas']['WebhookRequest'];
export type OperationData = components['schemas']['OperationData'];
export type WebhookPagination = CollectionEnvelope['meta']['pagination'];
export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };

function unavailableOrThrow(result: { error?: unknown; response: Response }): UnavailableRead {
  const unavailable = parseUnavailableRead(result.error);
  if (unavailable !== undefined) return unavailable;
  throw new ApiFailure(result.error as ErrorEnvelope | undefined, result.response.status);
}

function operationFrom(data: PublicData | undefined): OperationData | undefined {
  if (data === undefined || !('operationStatus' in data)) return undefined;
  return data as OperationData;
}

function idempotencyKey(action: string, resourceId?: string): string {
  return `console-${action}-${resourceId ?? 'new'}-${crypto.randomUUID()}`;
}

export async function listWebhooks(
  client: ApiClient,
  params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<{ items: WebhookResource[]; pagination: WebhookPagination }>> {
  const result = await client.GET('/v1/webhooks', {
    params: { query: { cursor: params.cursor, limit: params.limit ?? 50 } },
  });
  if (result.data !== undefined) {
    return {
      resource: {
        items: pickResources(result.data.data, 'webhook'),
        pagination: result.data.meta.pagination,
      },
    };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function getWebhook(
  client: ApiClient,
  webhookId: string,
): Promise<ReadResult<WebhookResource>> {
  const result = await client.GET('/v1/webhooks/{webhookId}', {
    params: { path: { webhookId } },
  });
  if (result.data !== undefined) {
    return { resource: pickResource(result.data.data, 'webhook') };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function registerWebhook(client: ApiClient, body: WebhookRequest) {
  const result = await client.POST('/v1/webhooks', {
    params: { header: { 'idempotency-key': idempotencyKey('register-webhook') } },
    body,
  });
  return operationFrom(unwrap(result).data);
}

export async function updateWebhook(
  client: ApiClient,
  webhookId: string,
  body: Partial<WebhookRequest>,
) {
  const result = await client.PATCH('/v1/webhooks/{webhookId}', {
    params: { path: { webhookId } },
    headers: { 'idempotency-key': idempotencyKey('update-webhook', webhookId) },
    body,
  });
  return operationFrom(unwrap(result).data);
}

export async function activateWebhook(client: ApiClient, webhookId: string) {
  const result = await client.POST('/v1/webhooks/{webhookId}/activate', {
    params: {
      path: { webhookId },
      header: { 'idempotency-key': idempotencyKey('activate-webhook', webhookId) },
    },
  });
  return operationFrom(unwrap(result).data);
}

export async function suspendWebhook(client: ApiClient, webhookId: string) {
  const result = await client.POST('/v1/webhooks/{webhookId}/suspend', {
    params: {
      path: { webhookId },
      header: { 'idempotency-key': idempotencyKey('suspend-webhook', webhookId) },
    },
  });
  return operationFrom(unwrap(result).data);
}

export async function retireWebhook(client: ApiClient, webhookId: string) {
  const result = await client.DELETE('/v1/webhooks/{webhookId}', {
    params: {
      path: { webhookId },
      header: { 'idempotency-key': idempotencyKey('retire-webhook', webhookId) },
    },
  });
  return operationFrom(unwrap(result).data);
}

export async function listWebhookDeliveries(
  client: ApiClient,
  params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<{ items: WebhookDeliveryResource[]; pagination: WebhookPagination }>> {
  const result = await client.GET('/v1/webhook-deliveries', {
    params: { query: { cursor: params.cursor, limit: params.limit ?? 50 } },
  });
  if (result.data !== undefined) {
    return {
      resource: {
        items: pickResources(result.data.data, 'webhookDelivery'),
        pagination: result.data.meta.pagination,
      },
    };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function getWebhookDeliveryHistory(
  client: ApiClient,
  deliveryId: string,
): Promise<ReadResult<{ data: PublicData; requestId: string }>> {
  const result = await client.GET('/v1/webhook-deliveries/{deliveryId}/history', {
    params: { path: { deliveryId } },
  });
  if (result.data !== undefined) {
    const envelope = unwrap(result);
    return { resource: { data: envelope.data, requestId: envelope.meta.requestId } };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function retryWebhookDelivery(client: ApiClient, deliveryId: string) {
  const result = await client.POST('/v1/webhook-deliveries/{deliveryId}/retry', {
    params: {
      path: { deliveryId },
      header: { 'idempotency-key': idempotencyKey('retry-webhook-delivery', deliveryId) },
    },
  });
  return operationFrom(unwrap(result).data);
}

export async function redriveWebhookDelivery(client: ApiClient, deliveryId: string) {
  const result = await client.POST('/v1/webhook-deliveries/{deliveryId}/redrive', {
    params: {
      path: { deliveryId },
      header: { 'idempotency-key': idempotencyKey('redrive-webhook-delivery', deliveryId) },
    },
  });
  return operationFrom(unwrap(result).data);
}

export async function bulkRedriveWebhookDeliveries(
  client: ApiClient,
  deliveryIds: string[],
) {
  const result = await client.POST('/v1/webhook-deliveries/redrive', {
    params: { header: { 'idempotency-key': idempotencyKey('bulk-redrive-webhook-deliveries') } },
    body: { deliveryIds },
  });
  return operationFrom(unwrap(result).data);
}
