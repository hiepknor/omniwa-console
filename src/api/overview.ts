import type { ApiClient } from './client';
import { unwrap } from './envelopes';
import type { components } from './generated/schema';

type OverviewPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.Overview'];
type HealthPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.ServerHealth'];
type ProjectionPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.ProjectionHealth'];

export type OverviewResource = {
  generatedAt?: string;
  scope: { type: 'server' | 'instance' | 'unknown'; instanceId?: string };
  window: { start?: string; end?: string; durationSeconds?: number };
  instances: { total?: number; connected?: number; disconnected?: number };
  projections: { groups?: number; contacts?: number; chats?: number; messages?: number; events?: number };
  messages: { total?: number; incoming?: number; outgoing?: number };
};

export type ProjectionHealthResource = {
  generatedAt?: string;
  status: string;
  total?: number;
  byStatus: Readonly<Record<string, number>>;
  resources: ReadonlyArray<{
    resource: string;
    instanceId?: string;
    syncStatus: string;
    pendingEvents?: number;
    processingEvents?: number;
    failedEvents?: number;
    deadLetterEvents?: number;
    eventLagSeconds?: number;
    reconcileAgeSeconds?: number;
    lastEventAt?: string;
    lastReconciledAt?: string;
    oldestUnprocessedAt?: string;
  }>;
};

export type InstanceHealthResource = {
  instanceId: string;
  connection: { status: string; connected: boolean };
  projection: ProjectionHealthResource;
  throttling: {
    status: string;
    observed: boolean;
    circuitState: string;
    openUntil?: string;
    retryAfterSeconds?: number;
  };
};

export type ServerHealthResource = {
  generatedAt?: string;
  api: { status: string };
  instances: InstanceHealthResource[];
};

function optionalCount(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function text(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

function projectionHealth(payload: ProjectionPayload | undefined): ProjectionHealthResource {
  return {
    generatedAt: payload?.generatedAt,
    status: text(payload?.status, 'unknown'),
    total: optionalCount(payload?.total),
    byStatus: { ...(payload?.byStatus ?? {}) },
    resources: (payload?.resources ?? []).map((resource) => ({
      resource: text(resource.resource, 'unknown'),
      instanceId: resource.instanceId?.trim() || undefined,
      syncStatus: text(resource.syncStatus, 'unknown'),
      pendingEvents: optionalCount(resource.pendingEvents),
      processingEvents: optionalCount(resource.processingEvents),
      failedEvents: optionalCount(resource.failedEvents),
      deadLetterEvents: optionalCount(resource.deadLetterEvents),
      eventLagSeconds: resource.eventLagSeconds,
      reconcileAgeSeconds: resource.reconcileAgeSeconds,
      lastEventAt: resource.lastEventAt,
      lastReconciledAt: resource.lastReconciledAt,
      oldestUnprocessedAt: resource.oldestUnprocessedAt,
    })),
  };
}

export async function getOverview(client: ApiClient, window = '24h'): Promise<OverviewResource> {
  const payload = unwrap<OverviewPayload>(await client.GET('/server/overview', { params: { query: { window } } }));
  return {
    generatedAt: payload?.generatedAt,
    scope: {
      type: payload?.scope?.type === 'server' || payload?.scope?.type === 'instance' ? payload.scope.type : 'unknown',
      instanceId: payload?.scope?.instanceId?.trim() || undefined,
    },
    window: {
      start: payload?.window?.start,
      end: payload?.window?.end,
      durationSeconds: optionalCount(payload?.window?.durationSeconds),
    },
    instances: {
      total: optionalCount(payload?.instances?.total),
      connected: optionalCount(payload?.instances?.connected),
      disconnected: optionalCount(payload?.instances?.disconnected),
    },
    projections: {
      groups: optionalCount(payload?.projections?.groups),
      contacts: optionalCount(payload?.projections?.contacts),
      chats: optionalCount(payload?.projections?.chats),
      messages: optionalCount(payload?.projections?.messages),
      events: optionalCount(payload?.projections?.events),
    },
    messages: {
      total: optionalCount(payload?.messages?.total),
      incoming: optionalCount(payload?.messages?.incoming),
      outgoing: optionalCount(payload?.messages?.outgoing),
    },
  };
}

export async function getServerHealth(client: ApiClient): Promise<ServerHealthResource> {
  const payload = unwrap<HealthPayload>(await client.GET('/server/health'));
  return {
    generatedAt: payload?.generatedAt,
    api: { status: text(payload?.api?.status, 'unknown') },
    instances: (payload?.instances ?? []).map((instance) => ({
      instanceId: text(instance.instanceId, 'unknown'),
      connection: {
        status: text(instance.connection?.status, 'unknown'),
        connected: instance.connection?.connected ?? false,
      },
      projection: projectionHealth(instance.projection),
      throttling: {
        status: text(instance.throttling?.status, 'unknown'),
        observed: instance.throttling?.observed ?? false,
        circuitState: text(instance.throttling?.circuitState, 'unknown'),
        openUntil: instance.throttling?.openUntil,
        retryAfterSeconds: instance.throttling?.retryAfterSeconds,
      },
    })),
  };
}

export async function getProjectionHealth(client: ApiClient): Promise<ProjectionHealthResource> {
  const payload = unwrap<ProjectionPayload>(await client.GET('/server/projection-health'));
  return projectionHealth(payload);
}
