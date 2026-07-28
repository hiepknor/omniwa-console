import type { ApiClient } from './client';
import { ApiFailure, unwrap, unwrapCommand, unwrapProjection, type CommandResult, type ProjectionMeta } from './envelopes';
import type { components } from './generated/schema';

type SummaryPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_groupList_repository.Summary'];
type EntryPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_groupList_service.EntryView'];
type AuditPayload = components['schemas']['apidocs.GroupListAuditEvent'];
type EligibilityPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_groupList_service.EligibilityResult'];
type AggregatePayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_groupList_service.EligibilityAggregate'];

export type GroupListSummary = {
  id: string;
  name: string;
  description?: string;
  groupCount?: number;
  version?: number;
  authorizationSource?: string;
  authorizedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};
export type GroupEligibility = 'eligible' | 'unavailable' | 'unknown';
export type GroupListEntry = {
  groupJid: string;
  snapshotName?: string;
  currentName?: string;
  eligibility: GroupEligibility;
  eligibilityReason?: string;
  canSend?: boolean;
  checkedAt?: string;
};
export type GroupEligibilityAggregate = {
  groupListId: string;
  groupListVersion?: number;
  total?: number;
  eligible?: number;
  unavailable?: number;
  unknown?: number;
  readyToTarget?: boolean;
  byReason?: Record<string, number>;
  checkedAt?: string;
};
export type GroupEligibilityAssessment = { items: GroupListEntry[]; meta?: ProjectionMeta };
export type GroupEligibilityIssueDetails = { issueCount: number; truncated: boolean; issues: GroupListEntry[] };
export type GroupListAudit = {
  id: string;
  eventType: string;
  actorType: string;
  fromVersion?: number;
  toVersion?: number;
  occurredAt?: string;
};
export type GroupListPage<T> = { items: T[]; nextCursor: string | null; meta?: ProjectionMeta };
export type GroupListAuthorization = { source: string; evidenceReference: string; authorizedAt: string };
export type GroupListWrite = { name: string; description?: string; groupJids: string[]; authorization: GroupListAuthorization };

const stringValue = (value: string | undefined, fallback = '') => value?.trim() || fallback;
const countValue = (value: number | undefined) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : undefined;
const versionValue = (value: number | undefined) => typeof value === 'number' && Number.isFinite(value) && value >= 1 ? value : undefined;
function summary(payload: SummaryPayload | undefined): GroupListSummary {
  return {
    id: stringValue(payload?.id), name: stringValue(payload?.name, 'Untitled group list'),
    description: payload?.description, groupCount: countValue(payload?.groupCount),
    version: versionValue(payload?.version), authorizationSource: payload?.authorizationSource,
    authorizedAt: payload?.authorizedAt, createdAt: payload?.createdAt, updatedAt: payload?.updatedAt,
  };
}
function nextCursor(meta?: ProjectionMeta): string | null { return meta?.nextCursor ?? null; }
function eligibility(payload: EligibilityPayload | undefined): GroupListEntry {
  return {
    groupJid: stringValue(payload?.groupJid), currentName: payload?.currentName,
    eligibility: payload?.eligibility === 'eligible' || payload?.eligibility === 'unavailable' ? payload.eligibility : 'unknown',
    eligibilityReason: payload?.eligibilityReason, canSend: typeof payload?.canSend === 'boolean' ? payload.canSend : undefined, checkedAt: payload?.checkedAt,
  };
}

export async function listGroupLists(client: ApiClient, params: { search?: string; cursor?: string; limit?: number } = {}): Promise<GroupListPage<GroupListSummary>> {
  const result = unwrapProjection<SummaryPayload[]>(await client.GET('/group-lists', { params: { query: { search: params.search, cursor: params.cursor, limit: params.limit ?? 50 } } }));
  return { items: (result.resource ?? []).map(summary).filter((item) => item.id), nextCursor: nextCursor(result.meta), meta: result.meta };
}
export async function getGroupList(client: ApiClient, id: string): Promise<GroupListSummary> {
  return summary(unwrap<SummaryPayload>(await client.GET('/group-lists/{groupListId}', { params: { path: { groupListId: id } } })));
}
export async function listGroupListEntries(client: ApiClient, id: string, params: { cursor?: string; limit?: number } = {}): Promise<GroupListPage<GroupListEntry>> {
  const result = unwrapProjection<EntryPayload[]>(await client.GET('/group-lists/{groupListId}/groups', { params: { path: { groupListId: id }, query: { cursor: params.cursor, limit: params.limit ?? 50 } } }));
  return {
    items: (result.resource ?? []).map((item): GroupListEntry => ({ ...eligibility(item), snapshotName: item.snapshotName })).filter((item) => item.groupJid),
    nextCursor: nextCursor(result.meta), meta: result.meta,
  };
}
export async function checkGroupEligibility(client: ApiClient, groupJids: string[]): Promise<GroupEligibilityAssessment> {
  const result = unwrapProjection<EligibilityPayload[]>(await client.POST('/group-lists/eligibility', { body: { groupJids } }));
  return { items: (result.resource ?? []).map(eligibility).filter((item) => item.groupJid), meta: result.meta };
}
export async function getGroupListEligibility(client: ApiClient, id: string, expectedVersion?: number): Promise<{ aggregate: GroupEligibilityAggregate; meta?: ProjectionMeta }> {
  const result = unwrapProjection<AggregatePayload>(await client.GET('/group-lists/{groupListId}/eligibility', { params: { path: { groupListId: id }, query: { expectedVersion } } }));
  const value = result.resource;
  return { aggregate: {
    groupListId: stringValue(value?.groupListId, id), groupListVersion: versionValue(value?.groupListVersion),
    total: countValue(value?.total), eligible: countValue(value?.eligible), unavailable: countValue(value?.unavailable), unknown: countValue(value?.unknown),
    readyToTarget: typeof value?.readyToTarget === 'boolean' ? value.readyToTarget : undefined, byReason: value?.byReason, checkedAt: value?.checkedAt,
  }, meta: result.meta };
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}
export function eligibilityIssues(error: unknown): GroupEligibilityIssueDetails | undefined {
  if (!(error instanceof ApiFailure)) return undefined;
  const details = objectValue(error.details);
  if (!details) return undefined;
  const issueCount = typeof details.issueCount === 'number' && Number.isFinite(details.issueCount) ? Math.max(0, details.issueCount) : 0;
  const issues = Array.isArray(details.issues) ? details.issues.map((item) => eligibility(objectValue(item) as EligibilityPayload | undefined)).filter((item) => item.groupJid) : [];
  return { issueCount: Math.max(issueCount, issues.length), truncated: details.truncated === true, issues };
}
export async function loadAllGroupListEntries(client: ApiClient, id: string, expectedCount: number): Promise<GroupListEntry[]> {
  const items: GroupListEntry[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await listGroupListEntries(client, id, { cursor, limit: 100 });
    for (const item of page.items) if (!seen.has(item.groupJid)) { seen.add(item.groupJid); items.push(item); }
    const next = page.nextCursor ?? undefined;
    if (next && next === cursor) throw new Error('Group List entry cursor did not advance.');
    cursor = next;
    if (items.length > Math.max(10_000, expectedCount)) throw new Error('Group List returned more entries than allowed.');
  } while (cursor);
  return items;
}
export async function listGroupListAudit(client: ApiClient, id: string, params: { cursor?: string; limit?: number } = {}): Promise<GroupListPage<GroupListAudit>> {
  const result = unwrapProjection<AuditPayload[]>(await client.GET('/group-lists/{groupListId}/audit', { params: { path: { groupListId: id }, query: { cursor: params.cursor, limit: params.limit ?? 50 } } }));
  return { items: (result.resource ?? []).map((item) => ({ id: stringValue(item.id), eventType: stringValue(item.eventType), actorType: stringValue(item.actorType), fromVersion: item.fromVersion, toVersion: item.toVersion, occurredAt: item.occurredAt })).filter((item) => item.id), nextCursor: nextCursor(result.meta), meta: result.meta };
}
export async function createGroupList(client: ApiClient, input: GroupListWrite): Promise<GroupListSummary> {
  return summary(unwrap<SummaryPayload>(await client.POST('/group-lists', { body: input })));
}
export async function updateGroupList(client: ApiClient, id: string, input: GroupListWrite & { expectedVersion: number }): Promise<GroupListSummary> {
  return summary(unwrap<SummaryPayload>(await client.PUT('/group-lists/{groupListId}', { params: { path: { groupListId: id } }, body: input })));
}
export async function deleteGroupList(client: ApiClient, id: string): Promise<CommandResult> {
  return unwrapCommand(await client.DELETE('/group-lists/{groupListId}', { params: { path: { groupListId: id } } }));
}
