import { readFile } from 'node:fs/promises';

const resources = Object.fromEntries(
  await Promise.all(
    Object.entries({
      app: new URL('../src/app/App.tsx', import.meta.url),
      connect: new URL('../src/app/ConnectPageV2.tsx', import.meta.url),
      connectFlow: new URL('../src/app/ConnectPage.tsx', import.meta.url),
      generation: new URL('../src/lib/ui-generation.ts', import.meta.url),
      shell: new URL('../src/app/ShellV2.tsx', import.meta.url),
      styles: new URL('../src/styles/ui-v2.css', import.meta.url),
    }).map(async ([name, url]) => [name, await readFile(url, 'utf8')]),
  ),
);

const failures = [];

if (!resources.generation.includes("value === 'v2' ? 'v2' : 'legacy'")) {
  failures.push('UI generation must fail closed to legacy unless v2 is explicit');
}
for (const required of ['UI_GENERATION', 'ActiveConnectPage', 'ActiveShell']) {
  if (!resources.app.includes(required)) failures.push(`App generation boundary is missing ${required}`);
}
if (!resources.connect.includes('useConnectFlow(onConnected)')) {
  failures.push('v2 Connect must reuse the audited connection flow');
}
if (resources.connect.includes('createApiClient') || resources.connect.includes('fetch(')) {
  failures.push('v2 Connect must not duplicate API access');
}
for (const required of [
  'autoComplete="off"',
  'Memory-only credential',
  'requestId={flow.connectionError.requestId}',
  'Validate origin',
  'Verify key',
  'Detect scope',
]) {
  if (!resources.connect.includes(required)) failures.push(`v2 Connect is missing ${required}`);
}
for (const required of [
  "GET('/instance/all'",
  "GET('/instance/status'",
  'pendingRef.current',
  'CONNECT_TIMEOUT_MS',
]) {
  if (!resources.connectFlow.includes(required)) failures.push(`shared Connect flow is missing ${required}`);
}
for (const forbidden of ["to: '/queue'", "to: '/webhooks'", "to: '/settings'", "to: '/settings/api-keys'"]) {
  if (resources.shell.includes(forbidden)) failures.push(`v2 navigation advertises deferred route ${forbidden}`);
}
for (const required of [
  "keyKind === 'admin'",
  "to: '/instances'",
  "to: '/recovery'",
  "to: '/chats'",
  "to: '/groups'",
  "to: '/messages'",
  "to: '/events'",
  'useServerCapabilities()',
  'Admin scope',
  'Instance scope',
  'Unknown scope',
  'In-memory credential',
]) {
  if (!resources.shell.includes(required)) failures.push(`v2 Shell is missing ${required}`);
}
for (const required of [
  '.ui-v2-connect__main',
  '.ui-v2-secret-toggle',
  '.ui-v2-shell__rail',
  '.ui-v2-shell__nav',
  '@media(max-width:900px)',
  '@media(max-width:640px)',
]) {
  if (!resources.styles.includes(required)) failures.push(`v2 Shell/Connect styles are missing ${required}`);
}
if (!resources.styles.includes('.ui-v2-secret-toggle{width:auto;min-width:64px')) {
  failures.push('mobile secret toggle must preserve its desktop pill geometry');
}

if (failures.length > 0) {
  console.error(`v2 Shell/Connect drift detected:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('v2 Shell and Connect remain contract-scoped, credential-safe, and generation-gated.');
}
