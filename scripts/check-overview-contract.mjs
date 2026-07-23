import { readFile } from 'node:fs/promises';

const resources = {
  page: new URL('../src/features/overview/OverviewPage.tsx', import.meta.url),
  health: new URL('../src/features/overview/HealthStrip.tsx', import.meta.url),
  metrics: new URL('../src/features/overview/MetricCards.tsx', import.meta.url),
  actions: new URL('../src/features/overview/ActionRequiredState.tsx', import.meta.url),
  events: new URL('../src/features/overview/EventTicker.tsx', import.meta.url),
  api: new URL('../src/api/overview.ts', import.meta.url),
  prototype: new URL('../design/prototypes/overview.html', import.meta.url),
  design: new URL('../design/DESIGN.md', import.meta.url),
  panels: new URL('../docs/PANELS.md', import.meta.url),
  appCss: new URL('../src/styles/console.css', import.meta.url),
  prototypeCss: new URL('../design/prototypes/console.css', import.meta.url),
};
const entries = await Promise.all(
  Object.entries(resources).map(async ([name, url]) => [name, await readFile(url, 'utf8')]),
);
const source = Object.fromEntries(entries);
const failures = [];

for (const required of [
  'Projection aggregate',
  'Health dimensions grouped by instance',
  'No consolidated action queue is available.',
  'Browser-safe live events are unavailable.',
]) {
  const app = `${source.health}\n${source.actions}\n${source.events}`;
  for (const [name, text] of [['app', app], ['prototype', source.prototype]]) {
    if (!text.includes(required)) failures.push(`${name}: missing synchronized Overview behavior: ${required}`);
  }
}

if (!source.prototype.includes('http://localhost:4000')) {
  failures.push('prototype: Overview API origin must use the documented local backend port 4000');
}

for (const required of [
  'useSearchParams()',
  "value: '720h'",
  'queryKeys.projectionHealth',
  '<MetricCards window={window} />',
  '<EventTicker connectionState="polling" />',
]) {
  if (!source.page.includes(required)) failures.push(`page: missing Overview state contract: ${required}`);
}

for (const required of [
  "client.GET('/server/overview'",
  "client.GET('/server/health')",
  "client.GET('/server/projection-health')",
  'optionalCount(payload?.instances?.total)',
]) {
  if (!source.api.includes(required)) failures.push(`api: missing Overview API contract: ${required}`);
}

for (const required of [
  '.overview-instance-health-list',
  '.overview-instance-health-head',
  '.overview-instance-health-reads',
]) {
  for (const name of ['appCss', 'prototypeCss']) {
    if (!source[name].includes(required)) failures.push(`${name}: missing grouped instance-health styling: ${required}`);
  }
}

if (source.events.includes('every 15 seconds') || source.prototype.includes('15 seconds')) {
  failures.push('copy: stale 15-second Overview refresh cadence returned');
}

for (const required of ['GET /server/overview?window=', 'GET /server/health', 'GET /server/projection-health']) {
  if (!source.panels.includes(required)) failures.push(`panels: missing assigned Overview operation: ${required}`);
}

for (const required of ['six comparable persisted metrics', 'Missing values render `Not reported`', 'URL-backed windows']) {
  const docs = `${source.design}\n${source.panels}`;
  if (!docs.includes(required)) failures.push(`docs: missing Overview behavior: ${required}`);
}

if (failures.length > 0) {
  console.error(`Overview contract drift detected:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Overview application, prototype, API ownership, and documentation are synchronized.');
}
