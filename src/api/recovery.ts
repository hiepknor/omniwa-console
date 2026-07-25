import type { ApiClient } from './client';
import { unwrap, unwrapCommand } from './envelopes';
import type { components } from './generated/schema';

type FailureItem = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.ProjectionFailureItem'];
type FailurePage = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.ProjectionFailurePage'];
type FailureResult = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.ProjectionFailureOperationResult'];

export type ProjectionFailure = {
  deadLetteredAt?: string;
  eventKey: string;
  eventType?: string;
  failureClass?: string;
  ingestedAt?: string;
  instanceId: string;
  lastAttemptAt?: string;
  lastErrorCode?: string;
  maxAttempts?: number;
  occurredAt?: string;
  resource: string;
  retryCount?: number;
};

export type ProjectionFailureFilters = {
  instanceId?: string;
  resource?: string;
  limit: number;
  cursor?: string;
};

export type ProjectionFailureCommand = {
  eventKey: string;
  instanceId: string;
  reason: string;
  resource: string;
};

export type ProjectionFailureAcknowledgement = {
  action?: string;
  eventKey?: string;
  instanceId?: string;
  occurredAt?: string;
  resource?: string;
  message?: string;
};

function text(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

function count(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function normalizeFailure(item: FailureItem): ProjectionFailure | undefined {
  const eventKey = text(item.eventKey);
  const instanceId = text(item.instanceId);
  const resource = text(item.resource);
  if (!eventKey || !instanceId || !resource) return undefined;
  return {
    deadLetteredAt: text(item.deadLetteredAt),
    eventKey,
    eventType: text(item.eventType),
    failureClass: text(item.failureClass),
    ingestedAt: text(item.ingestedAt),
    instanceId,
    lastAttemptAt: text(item.lastAttemptAt),
    lastErrorCode: text(item.lastErrorCode),
    maxAttempts: count(item.maxAttempts),
    occurredAt: text(item.occurredAt),
    resource,
    retryCount: count(item.retryCount),
  };
}

export async function getProjectionFailures(
  client: ApiClient,
  filters: ProjectionFailureFilters,
): Promise<{ items: ProjectionFailure[]; nextCursor?: string }> {
  const payload = unwrap<FailurePage>(await client.GET('/server/projection-failures', {
    params: { query: filters },
  }));
  return {
    items: (payload?.items ?? []).flatMap((item) => {
      const normalized = normalizeFailure(item);
      return normalized ? [normalized] : [];
    }),
    nextCursor: text(payload?.nextCursor),
  };
}

async function runFailureCommand(
  client: ApiClient,
  action: 'replay' | 'discard',
  body: ProjectionFailureCommand,
): Promise<ProjectionFailureAcknowledgement> {
  const result = unwrapCommand(await client.POST(`/server/projection-failures/${action}`, {
    body,
  }));
  const data = result.data as FailureResult | undefined;
  return {
    action: text(data?.action),
    eventKey: text(data?.eventKey),
    instanceId: text(data?.instanceId),
    occurredAt: text(data?.occurredAt),
    resource: text(data?.resource),
    message: result.message,
  };
}

export function replayProjectionFailure(client: ApiClient, body: ProjectionFailureCommand) {
  return runFailureCommand(client, 'replay', body);
}

export function discardProjectionFailure(client: ApiClient, body: ProjectionFailureCommand) {
  return runFailureCommand(client, 'discard', body);
}
