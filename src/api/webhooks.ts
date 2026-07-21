import type { ApiClient } from './client';
import type { components } from './generated/platform-schema';
import { notImplemented, type CollectionEnvelope, type CommandResult, type PublicData, type UnavailableRead } from './envelopes';

// omniwa-go configures a webhook URL per instance (on create/connect) but has no
// webhook management/delivery REST surface. This panel is stubbed.
export type WebhookResource = components['schemas']['WebhookResource'];
export type WebhookDeliveryResource = components['schemas']['WebhookDeliveryResource'];
export type WebhookRequest = components['schemas']['WebhookRequest'];
export type WebhookPagination = CollectionEnvelope['meta']['pagination'];
export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };

export async function listWebhooks(
  _client: ApiClient,
  _params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<{ items: WebhookResource[]; pagination: WebhookPagination }>> {
  throw notImplemented('Webhooks');
}

export async function getWebhook(_client: ApiClient, _webhookId: string): Promise<ReadResult<WebhookResource>> {
  throw notImplemented('Webhook detail');
}

export async function registerWebhook(_client: ApiClient, _body: WebhookRequest): Promise<CommandResult> {
  throw notImplemented('Webhook registration');
}

export async function updateWebhook(
  _client: ApiClient,
  _webhookId: string,
  _body: Partial<WebhookRequest>,
): Promise<CommandResult> {
  throw notImplemented('Webhook update');
}

export async function activateWebhook(_client: ApiClient, _webhookId: string): Promise<CommandResult> {
  throw notImplemented('Webhook activation');
}

export async function suspendWebhook(_client: ApiClient, _webhookId: string): Promise<CommandResult> {
  throw notImplemented('Webhook suspension');
}

export async function retireWebhook(_client: ApiClient, _webhookId: string): Promise<CommandResult> {
  throw notImplemented('Webhook retirement');
}

export async function listWebhookDeliveries(
  _client: ApiClient,
  _params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<{ items: WebhookDeliveryResource[]; pagination: WebhookPagination }>> {
  throw notImplemented('Webhook deliveries');
}

export async function getWebhookDeliveryHistory(
  _client: ApiClient,
  _deliveryId: string,
): Promise<ReadResult<{ data: PublicData; requestId: string }>> {
  throw notImplemented('Webhook delivery history');
}

export async function retryWebhookDelivery(_client: ApiClient, _deliveryId: string): Promise<CommandResult> {
  throw notImplemented('Webhook delivery retry');
}

export async function redriveWebhookDelivery(_client: ApiClient, _deliveryId: string): Promise<CommandResult> {
  throw notImplemented('Webhook delivery redrive');
}

export async function bulkRedriveWebhookDeliveries(_client: ApiClient, _deliveryIds: string[]): Promise<CommandResult> {
  throw notImplemented('Webhook bulk redrive');
}
