import type { ApiClient } from './client';
import { unwrap } from './envelopes';
import type { components } from './generated/schema';

type OverviewPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.Overview'];
type HealthPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.ServerHealth'];
type ProjectionPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.ProjectionHealth'];

export type OverviewResource = {
  generatedAt?: string;
  scope: { type: 'server' | 'instance' | 'unknown'; instanceId?: string };
  window: { start?: string; end?: string; durationSeconds: number };
  instances: { total: number; connected: number; disconnected: number };
  projections: { groups: number; contacts: number; chats: number; messages: number; events: number };
  messages: { total: number; incoming: number; outgoing: number };
};

export type ProjectionHealthResource = {
  status: string;
  total: number;
  byStatus: Readonly<Record<string, number>>;
  resources: ReadonlyArray<{
    resource: string;
    syncStatus: string;
    eventLagSeconds?: number;
    reconcileAgeSeconds?: number;
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

function count(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function text(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

function projectionHealth(payload: ProjectionPayload | undefined): ProjectionHealthResource {
  return {
    status: text(payload?.status, 'unknown'),
    total: count(payload?.total),
    byStatus: { ...(payload?.byStatus ?? {}) },
    resources: (payload?.resources ?? []).map((resource) => ({
      resource: text(resource.resource, 'unknown'),
      syncStatus: text(resource.syncStatus, 'unknown'),
      eventLagSeconds: resource.eventLagSeconds,
      reconcileAgeSeconds: resource.reconcileAgeSeconds,
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
      durationSeconds: count(payload?.window?.durationSeconds),
    },
    instances: {
      total: count(payload?.instances?.total),
      connected: count(payload?.instances?.connected),
      disconnected: count(payload?.instances?.disconnected),
    },
    projections: {
      groups: count(payload?.projections?.groups),
      contacts: count(payload?.projections?.contacts),
      chats: count(payload?.projections?.chats),
      messages: count(payload?.projections?.messages),
      events: count(payload?.projections?.events),
    },
    messages: {
      total: count(payload?.messages?.total),
      incoming: count(payload?.messages?.incoming),
      outgoing: count(payload?.messages?.outgoing),
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
