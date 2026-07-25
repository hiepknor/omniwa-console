import { readFile } from 'node:fs/promises';

const resources = {
  app: new URL('../src/app/ConnectPage.tsx', import.meta.url),
  flow: new URL('../src/app/connect-flow.ts', import.meta.url),
  prototype: new URL('../design/prototypes/connect.html', import.meta.url),
  design: new URL('../design/DESIGN.md', import.meta.url),
  auth: new URL('../docs/AUTH_AND_SESSION.md', import.meta.url),
  appCss: new URL('../src/styles/console.css', import.meta.url),
  prototypeCss: new URL('../design/prototypes/console.css', import.meta.url),
};
const entries = await Promise.all(
  Object.entries(resources).map(async ([name, url]) => [name, await readFile(url, 'utf8')]),
);
const source = Object.fromEntries(entries);
source.app += `\n${source.flow}`;
const failures = [];

for (const [name, text] of Object.entries(source)) {
  for (const forbidden of ['Probe health', 'console origin to route requests through the Vite proxy']) {
    if (text.includes(forbidden)) failures.push(`${name}: stale Connect copy returned: ${forbidden}`);
  }
}

for (const required of [
  'Verify key',
  'http://localhost:4000',
  'Enter the OmniWA GO API origin directly.',
]) {
  for (const name of ['app', 'prototype']) {
    if (!source[name].includes(required)) failures.push(`${name}: missing synchronized Connect contract: ${required}`);
  }
}

for (const required of [
  'CONNECT_TIMEOUT_MS = 15_000',
  "url.protocol !== 'http:' && url.protocol !== 'https:'",
  'requestId={connectionError.requestId}',
  'spellCheck={false}',
  'disabled={pending}',
  "probeStage === 'verify-key' ? 'active'",
  'detail={connectionError.detail}',
  "aria-label={pending ? 'Validate origin, complete'",
]) {
  if (!source.app.includes(required)) failures.push(`app: missing hardened Connect behavior: ${required}`);
}

for (const required of [
  '.connect-sequence li[data-state=active]',
  '.connect-sequence-index::after{content:"✓"',
  '.connect-submit:disabled{background:var(--recessed)',
  '.connect-key-toggle{min-height:24px;padding:2px 9px;border:1px solid var(--border-subtle);border-radius:var(--radius-pill)',
]) {
  for (const name of ['appCss', 'prototypeCss']) {
    if (!source[name].includes(required)) failures.push(`${name}: missing synchronized Connect visual state: ${required}`);
  }
}

function connectCssBlock(text) {
  const start = text.indexOf('/* ===== Connect entry surface ===== */');
  const end = text.indexOf('/* ===== Shared dropdown contract ===== */', start);
  return text.slice(start, end).replace(
    '/* Synced verbatim from design/prototypes/console.css — Shared dropdown contract. */',
    '',
  ).trim();
}

if (connectCssBlock(source.appCss) !== connectCssBlock(source.prototypeCss)) {
  failures.push('css: application and prototype Connect blocks differ');
}

for (const name of ['appCss', 'prototypeCss']) {
  const connectCss = connectCssBlock(source[name]);
  const responsiveCss = connectCss.slice(connectCss.indexOf('@media'));
  if (responsiveCss.includes('.connect-key-toggle')) {
    failures.push(`${name}: Connect key toggle must retain its desktop shape at responsive breakpoints`);
  }
}

for (const required of ['GET /instance/all', 'GET /instance/status', '15 seconds', 'memory only']) {
  if (!source.design.includes(required) && !source.auth.includes(required)) {
    failures.push(`docs: missing Connect behavior: ${required}`);
  }
}

if (failures.length > 0) {
  console.error(`Connect contract drift detected:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Connect application, prototype, and documentation are synchronized.');
}
