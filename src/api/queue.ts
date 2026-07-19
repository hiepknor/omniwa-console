import type { ApiClient } from './client';
import type { components } from './generated/schema';
import {
  ApiFailure,
  parseUnavailableRead,
  pickResource,
  pickResources,
  type CollectionEnvelope,
  type ErrorEnvelope,
  type UnavailableRead,
} from './envelopes';

export type QueueStatusResource = components['schemas']['MetricsResource'];
export type JobResource = components['schemas']['JobResource'];
export type QueuePagination = CollectionEnvelope['meta']['pagination'];
export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };

function unavailableOrThrow(result: { error?: unknown; response: Response }): UnavailableRead {
  const unavailable = parseUnavailableRead(result.error);
  if (unavailable !== undefined) return unavailable;
  throw new ApiFailure(result.error as ErrorEnvelope | undefined, result.response.status);
}

export async function getQueueStatus(
  client: ApiClient,
): Promise<ReadResult<QueueStatusResource>> {
  const result = await client.GET('/v1/queue');
  if (result.data !== undefined) {
    return { resource: pickResource(result.data.data, 'metrics') };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function listJobs(
  client: ApiClient,
  params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<{ items: JobResource[]; pagination: QueuePagination }>> {
  const result = await client.GET('/v1/jobs', {
    params: { query: { cursor: params.cursor, limit: params.limit ?? 50 } },
  });
  if (result.data !== undefined) {
    return {
      resource: {
        items: pickResources(result.data.data, 'job'),
        pagination: result.data.meta.pagination,
      },
    };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function getJob(
  client: ApiClient,
  jobId: string,
): Promise<ReadResult<JobResource>> {
  const result = await client.GET('/v1/jobs/{jobId}', {
    params: { path: { jobId } },
  });
  if (result.data !== undefined) {
    return { resource: pickResource(result.data.data, 'job') };
  }
  return { unavailable: unavailableOrThrow(result) };
}
