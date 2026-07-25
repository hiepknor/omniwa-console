import { readFile } from 'node:fs/promises';
const resources = Object.fromEntries(await Promise.all(Object.entries({
  app: new URL('../src/app/generation-v2.tsx', import.meta.url), page: new URL('../src/features/groups-v2/GroupsPageV2.tsx', import.meta.url),
  workspace: new URL('../src/features/groups-v2/GroupWorkspaceV2.tsx', import.meta.url), hooks: new URL('../src/features/groups-v2/hooks.ts', import.meta.url),
  route: new URL('../src/features/groups-v2/route-state.ts', import.meta.url), styles: new URL('../src/styles/ui-v2.css', import.meta.url),
}).map(async ([name, url]) => [name, await readFile(url, 'utf8')])));
const failures = [];
for (const required of ['GroupsPageV2', "path: '/groups/:groupId'", "UI_GENERATION = 'v2'"]) if (!resources.app.includes(required)) failures.push(`v2 Groups route boundary is missing ${required}`);
for (const required of ["keyKind === 'api'", 'groups_projection', 'No live WhatsApp group lookup', 'useSearchParams()']) if (!resources.page.includes(required)) failures.push(`Groups scope/projection gate is missing ${required}`);
for (const required of ['listInstanceGroups', 'getGroup', 'getGroupInviteLink', 'createGroup', 'updateGroupSetting', 'removeGroupMember', 'leaveGroup', 'sendGroupTextMessage']) if (!resources.hooks.includes(required)) failures.push(`Groups hooks are missing ${required}`);
if (Object.values(resources).some((source) => source.includes("'/instance/all'"))) failures.push('Groups v2 must not call GET /instance/all');
for (const required of ["readOptionalSearchParam(searchParams, 'cursor')", "readSearchText(searchParams, 'search')"]) if (!resources.route.includes(required)) failures.push(`Groups route state is missing ${required}`);
for (const required of ['refreshed group projection remains authoritative', 'does not prove provider completion', 'No one-click retry', "confirmText !== group.id", 'partial failure']) if (!resources.workspace.includes(required)) failures.push(`Groups command safety is missing ${required}`);
if (resources.hooks.includes('retry:') || resources.hooks.includes('onMutate') || resources.workspace.includes('optimistic')) failures.push('Group commands must not retry automatically or update optimistically');
for (const required of ['.ui-v2-groups-table', '.ui-v2-member-list', '.ui-v2-group-filters', '.ui-v2-groups-metrics']) if (!resources.styles.includes(required)) failures.push(`Groups responsive styles are missing ${required}`);
if (failures.length) { console.error(`v2 Groups drift detected:\n- ${failures.join('\n- ')}`); process.exitCode = 1; } else console.log('v2 Groups remains instance-scoped, projection-first, URL-addressable, and acknowledgement-safe.');
