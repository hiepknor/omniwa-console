import type { ApiClient } from './client';
import type { components } from './generated/platform-schema';
import { NOT_IMPLEMENTED_READ, type CollectionEnvelope, type UnavailableRead } from './envelopes';

// omniwa-go exposes no queue/jobs surface. Reads report a neutral unavailable state.
export type QueueStatusResource = components['schemas']['MetricsResource'];
export type JobResource = components['schemas']['JobResource'];
export type QueuePagination = CollectionEnvelope['meta']['pagination'];
export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };

export async function getQueueStatus(_client: ApiClient): Promise<ReadResult<QueueStatusResource>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function listJobs(
  _client: ApiClient,
  _params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<{ items: JobResource[]; pagination: QueuePagination }>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function getJob(_client: ApiClient, _jobId: string): Promise<ReadResult<JobResource>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}
