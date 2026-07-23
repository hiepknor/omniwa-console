import { readFile } from 'node:fs/promises';

const resources = Object.fromEntries(await Promise.all(Object.entries({
  app: new URL('../src/app/App.tsx', import.meta.url),
  shell: new URL('../src/app/ShellV2.tsx', import.meta.url),
  overview: new URL('../src/features/platform-v2/OverviewPageV2.tsx', import.meta.url),
  recovery: new URL('../src/features/platform-v2/RecoveryPageV2.tsx', import.meta.url),
  recoveryApi: new URL('../src/api/recovery.ts', import.meta.url),
  hooks: new URL('../src/features/platform-v2/hooks.ts', import.meta.url),
  routeState: new URL('../src/features/platform-v2/route-state.ts', import.meta.url),
  styles: new URL('../src/styles/ui-v2.css', import.meta.url),
}).map(async ([name, url]) => [name, await readFile(url, 'utf8')])));

const failures = [];
for (const required of ['OverviewPageV2', 'RecoveryPageV2', "path: '/recovery'", "UI_GENERATION === 'v2'"]) {
  if (!resources.app.includes(required)) failures.push(`v2 route boundary is missing ${required}`);
}
for (const required of ["GET('/server/overview'", "GET('/server/health'", "GET('/server/projection-health'"]) {
  const overviewApi = await readFile(new URL('../src/api/overview.ts', import.meta.url), 'utf8');
  if (!overviewApi.includes(required)) failures.push(`Overview API is missing ${required}`);
}
for (const required of ["GET('/server/projection-failures'", "'/server/projection-failures/replay'", "'/server/projection-failures/discard'"]) {
  if (!resources.recoveryApi.includes(required) && !resources.recoveryApi.includes('`/server/projection-failures/${action}`')) failures.push(`Recovery API is missing ${required}`);
}
for (const required of ['projection_failure_operations', "keyKind !== 'admin'", 'useSearchParams()', 'minimum 8 characters', 'acknowledgement does not prove projection recovery', 'Automatic retries are disabled']) {
  if (!resources.recovery.includes(required)) failures.push(`Recovery workflow is missing ${required}`);
}
if (!resources.routeState.includes("searchParams.get('cursor')")) failures.push('Recovery route state is missing its opaque cursor');
if (resources.hooks.includes('retry:') || resources.recovery.includes('optimistic')) {
  failures.push('Recovery commands must not add retry or optimistic behavior');
}
for (const required of ['Missing values remain unreported', 'Connection, projection, and throttling remain independent', 'deadLetterEvents', 'Open recovery']) {
  if (!resources.overview.includes(required)) failures.push(`Platform Overview is missing ${required}`);
}
if (!resources.shell.includes("to: '/recovery'") || !resources.shell.includes('recoveryAvailable')) {
  failures.push('Recovery navigation must be capability-gated');
}
for (const required of ['.ui-v2-page', '.ui-v2-metric-grid', '.ui-v2-recovery-filters', '.ui-v2-detail-list']) {
  if (!resources.styles.includes(required)) failures.push(`Platform v2 styles are missing ${required}`);
}

if (failures.length > 0) {
  console.error(`v2 Platform/Recovery drift detected:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('v2 Platform and Recovery remain contract-owned, capability-gated, and acknowledgement-safe.');
}
