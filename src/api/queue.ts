import type { ApiClient } from './client';
import type { components } from './generated/platform-schema';
import { notImplemented, type CollectionEnvelope, type UnavailableRead } from './envelopes';

// omniwa-go exposes no queue/jobs surface. This panel is stubbed as not_implemented.
export type QueueStatusResource = components['schemas']['MetricsResource'];
export type JobResource = components['schemas']['JobResource'];
export type QueuePagination = CollectionEnvelope['meta']['pagination'];
export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };

export async function getQueueStatus(_client: ApiClient): Promise<ReadResult<QueueStatusResource>> {
  throw notImplemented('Queue status');
}

export async function listJobs(
  _client: ApiClient,
  _params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<{ items: JobResource[]; pagination: QueuePagination }>> {
  throw notImplemented('Jobs');
}

export async function getJob(_client: ApiClient, _jobId: string): Promise<ReadResult<JobResource>> {
  throw notImplemented('Job detail');
}
