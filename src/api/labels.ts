import type { ApiClient } from './client';
import { unwrapProjection, type ProjectionMeta } from './envelopes';
import type { components } from './generated/schema';

type LabelPayload = components['schemas']['apidocs.LabelItem'];

export type LabelResource = {
  resourceType: 'label';
  id: string;
  name?: string;
  color?: string;
  predefinedId?: string;
};

export type LabelReadResult<T> = { resource: T; meta?: ProjectionMeta };

function nonEmpty(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

function toLabel(payload: LabelPayload, fallbackId = ''): LabelResource {
  const id = nonEmpty(payload.label_id) ?? nonEmpty(payload.id) ?? fallbackId;
  return {
    resourceType: 'label',
    id,
    name: nonEmpty(payload.label_name),
    color: nonEmpty(payload.label_color),
    predefinedId: nonEmpty(payload.predefined_id),
  };
}

export async function listLabels(client: ApiClient): Promise<LabelReadResult<LabelResource[]>> {
  const projection = unwrapProjection<LabelPayload[]>(await client.GET('/label/list'));
  return {
    resource: (projection.resource ?? [])
      .map((payload) => toLabel(payload))
      .filter((label) => label.id !== ''),
    meta: projection.meta,
  };
}

export async function getLabel(client: ApiClient, labelId: string): Promise<LabelReadResult<LabelResource>> {
  const projection = unwrapProjection<LabelPayload>(await client.GET('/label/info/{labelId}', {
    params: { path: { labelId } },
  }));
  return { resource: toLabel(projection.resource, labelId), meta: projection.meta };
}
