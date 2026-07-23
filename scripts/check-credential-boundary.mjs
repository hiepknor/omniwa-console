import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const read = (path) => readFile(resolve(root, path), 'utf8');
const failures = [];

const instances = await read('src/api/instances.ts');
const resource = instances.match(/export type InstanceResource = \{([\s\S]*?)\n\};/)?.[1] ?? '';
if (/\btoken\??\s*:/.test(resource)) {
  failures.push('InstanceResource must never contain a bearer token');
}
if (!instances.includes("client.GET('/instance/metadata')") || !instances.includes("client.GET('/instance/metadata/{instanceId}'")) {
  failures.push('credential-free metadata list/detail adapters are required');
}

const provider = await read('src/api/ApiProvider.tsx');
if (!provider.includes('InstanceCredentialsContext')) {
  failures.push('the in-memory instance credential vault is missing');
}

const instanceDrawer = await read('src/features/instances/InstanceDrawer.tsx');
if (!instanceDrawer.includes('useSetInstanceCredential') || !instanceDrawer.includes('Use for this session')) {
  failures.push('existing instance tokens must be attachable to the in-memory vault after reload');
}
if (/localStorage|sessionStorage/.test(provider)) {
  failures.push('the instance credential vault must not use browser storage');
}

const session = await read('src/lib/session.ts');
const connectPage = await read('src/app/ConnectPage.tsx');
const app = await read('src/app/App.tsx');
if (/\.setItem\s*\(/.test(session) || /saveSession|loadSession/.test(session)) {
  failures.push('the admin API session must remain memory-only');
}
if (/Remember on this device|\bremember\b/.test(connectPage)) {
  failures.push('the connect screen must not offer persistent credential storage');
}
if (!connectPage.includes('autoComplete="off"')) {
  failures.push('the connect API key input must disable password autocomplete');
}
if (!app.includes('clearSession();') || !app.includes('return null;')) {
  failures.push('application startup must clear legacy stored sessions');
}

const credentialHealthPanel = await read('src/features/instances/CredentialHealthPanel.tsx');
if (!credentialHealthPanel.includes('No representative workload') || !credentialHealthPanel.includes('never derives a safe-to-remove decision')) {
  failures.push('credential health must reject a 0/0 adoption verdict and avoid a safety decision');
}

const keys = await read('src/api/keys.ts');
if (/queryKey[^\n]*token|\[[^\n]*token[^\n]*\]\s+as const/i.test(keys)) {
  failures.push('query keys must be scoped by identity, never credential value');
}

for (const path of [
  'src/features/campaigns/CampaignsPage.tsx',
  'src/features/chats/ChatsPage.tsx',
  'src/features/chats/ConversationList.tsx',
  'src/features/events/EventsPage.tsx',
  'src/features/groups/GroupsPage.tsx',
  'src/features/instances/InstanceDrawer.tsx',
]) {
  const source = await read(path);
  if (/\b(?:instance|selectedInstance|selected)\??\.token\b/.test(source)) {
    failures.push(`${path}: ordinary resource models must not supply scoped credentials`);
  }
}

if (failures.length) {
  console.error(`Credential boundary violations:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Credential boundaries are intact.');
}
