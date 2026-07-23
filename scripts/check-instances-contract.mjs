import { readFile } from 'node:fs/promises';

const resources = {
  page: new URL('../src/features/instances/InstancesPage.tsx', import.meta.url),
  drawer: new URL('../src/features/instances/InstanceDrawer.tsx', import.meta.url),
  credentialHealth: new URL('../src/features/instances/CredentialHealthPanel.tsx', import.meta.url),
  createDialog: new URL('../src/features/instances/CreateInstanceDialog.tsx', import.meta.url),
  api: new URL('../src/api/instances.ts', import.meta.url),
  panels: new URL('../docs/PANELS.md', import.meta.url),
  design: new URL('../design/DESIGN.md', import.meta.url),
  prototype: new URL('../design/prototypes/instances.html', import.meta.url),
  appCss: new URL('../src/styles/console.css', import.meta.url),
  prototypeCss: new URL('../design/prototypes/console.css', import.meta.url),
  drawerTest: new URL('../src/features/instances/InstanceDrawer.test.ts', import.meta.url),
  dialogTest: new URL('../src/features/instances/CreateInstanceDialog.test.ts', import.meta.url),
};

const entries = await Promise.all(Object.entries(resources).map(async ([name, url]) => [name, await readFile(url, 'utf8')]));
const source = Object.fromEntries(entries);
const failures = [];

for (const required of [
  "'connected · metadata'",
  "label: 'status unavailable'",
  "label: 'paired · disconnected'",
  'status.isError && <InlineError',
  "'Refresh QR'",
]) {
  if (!source.drawer.includes(required)) failures.push(`drawer: missing verified lifecycle behavior: ${required}`);
}

for (const required of [
  'optionalCount(data?.currentKeyVersion)',
  'total?: number',
  'lookups?: number',
]) {
  if (!source.api.includes(required)) failures.push(`api: missing unavailable credential fact behavior: ${required}`);
}

for (const required of [
  "value ?? 'Not reported'",
  'Coverage is not reported',
  'Fallback activity is not reported',
]) {
  if (!source.credentialHealth.includes(required)) failures.push(`credential health: missing explicit unavailable state: ${required}`);
}

const tableIndex = source.page.indexOf('<DataTableWorkspace');
const credentialIndex = source.page.indexOf('<CredentialHealthPanel');
if (tableIndex < 0 || credentialIndex < 0 || credentialIndex < tableIndex) failures.push('page: lifecycle table must precede Credential Health');
for (const required of ['disabled={!canManage}', "const createOpen = canManage &&", "return keyKind === 'admin'"]) {
  if (!source.page.includes(required)) failures.push(`page: missing admin command gate: ${required}`);
}

for (const required of ['canClose={!isPending && created === undefined}', 'showClose={created === undefined}', 'backdrop dismissal are disabled']) {
  if (!source.createDialog.includes(required)) failures.push(`create dialog: one-time token dismissal is not guarded: ${required}`);
}

for (const name of ['appCss', 'prototypeCss']) {
  if (!source[name].includes('@container (max-width:400px)')) failures.push(`${name}: compact row breakpoint is not container-safe at 400px`);
}

for (const required of ['http://localhost:4000', 'Polling · 30s', '>Created<', 'Credential Health', 'Refresh QR']) {
  if (!source.prototype.includes(required)) failures.push(`prototype: missing synchronized Instances behavior: ${required}`);
}
for (const stale of ['http://localhost:3000', 'Msgs 24h', 'Provider capabilities', 'Expires in', '>live<']) {
  if (source.prototype.includes(stale)) failures.push(`prototype: stale Instances behavior returned: ${stale}`);
}

if (!source.panels.includes('POST   /instance/rotate-token/{instanceId}')) failures.push('panels: token rotation operation is not assigned to Instances');
for (const required of ['Missing Credential Health values render `Not reported`', 'paired-but-disconnected', 'must not invent a countdown']) {
  if (!source.design.includes(required)) failures.push(`design: missing Instances contract: ${required}`);
}

for (const required of ['paired · disconnected', 'status unavailable']) {
  if (!source.drawerTest.includes(required)) failures.push(`drawer test: missing lifecycle regression: ${required}`);
}
for (const required of ['I stored the token', 'Close new instance dialog']) {
  if (!source.dialogTest.includes(required)) failures.push(`dialog test: missing one-time token regression: ${required}`);
}

if (failures.length > 0) {
  console.error(`Instances contract drift detected:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Instances application, prototype, API ownership, and documentation are synchronized.');
}
