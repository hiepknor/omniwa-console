import { readFile } from 'node:fs/promises';

const resources = Object.fromEntries(await Promise.all(Object.entries({
  app: new URL('../src/app/App.tsx', import.meta.url),
  page: new URL('../src/features/instances-v2/InstancesPageV2.tsx', import.meta.url),
  workspace: new URL('../src/features/instances-v2/InstanceWorkspaceV2.tsx', import.meta.url),
  create: new URL('../src/features/instances-v2/CreateInstanceV2.tsx', import.meta.url),
  health: new URL('../src/features/instances-v2/CredentialHealthV2.tsx', import.meta.url),
  hooks: new URL('../src/features/instances-v2/hooks.ts', import.meta.url),
  styles: new URL('../src/styles/ui-v2.css', import.meta.url),
}).map(async ([name, url]) => [name, await readFile(url, 'utf8')])));

const failures = [];
for (const required of ['InstancesPageV2', 'ActiveInstancesPage', "path: '/instances/:instanceId'"]) {
  if (!resources.app.includes(required)) failures.push(`v2 route boundary is missing ${required}`);
}
for (const required of ['metadata: true', 'useInstanceV2', 'useCredentialHealthV2']) {
  if (!resources.hooks.includes(required)) failures.push(`Instances v2 hooks are missing ${required}`);
}
if (Object.values(resources).some((source) => source.includes("'/instance/all'"))) {
  failures.push('Instances v2 must not fall back to GET /instance/all');
}
for (const required of ["keyKind !== 'admin'", 'instance_metadata_views', 'useSearchParams()', 'No fleet request was sent']) {
  if (!resources.page.includes(required)) failures.push(`Instances v2 fleet gate is missing ${required}`);
}
for (const required of ['instance_credential_health', 'never derives safeToRemove', '0/0 baseline']) {
  if (!resources.health.includes(required)) failures.push(`Credential-health governance is missing ${required}`);
}
for (const required of ['Held in memory only', 'Status not read', 'Metadata connection', 'Pairing is complete only when status reports loggedIn', 'confirmText !== instance.id', 'One-time replacement token']) {
  if (!resources.workspace.includes(required)) failures.push(`Instance workspace is missing ${required}`);
}
for (const required of ['shown once', 'I stored the token', 'does not prove pairing or connectivity']) {
  if (!resources.create.includes(required)) failures.push(`Create acknowledgement is missing ${required}`);
}
if (resources.hooks.includes('retry:') || resources.workspace.includes('optimistic')) {
  failures.push('Instance commands must not add retry or optimistic behavior');
}
for (const required of ['.ui-v2-instance-filters', '.ui-v2-instances-table', '.ui-v2-credential-grid', '.ui-v2-qr-workspace', '.ui-v2-settings-list']) {
  if (!resources.styles.includes(required)) failures.push(`Instances v2 styles are missing ${required}`);
}

if (failures.length > 0) {
  console.error(`v2 Instances drift detected:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('v2 Instances remains metadata-only, credential-safe, responsive, and acknowledgement-safe.');
}
