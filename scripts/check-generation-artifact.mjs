import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const generation = process.env.VITE_CONSOLE_UI_GENERATION === 'v2' ? 'v2' : 'legacy';
const assetDirectory = resolve(new URL('../dist/assets', import.meta.url).pathname);
const names = await readdir(assetDirectory);
const javascriptNames = names.filter((name) => name.endsWith('.js'));
const cssNames = names.filter((name) => name.endsWith('.css'));
const [javascript, css] = await Promise.all([
  Promise.all(javascriptNames.map((name) => readFile(resolve(assetDirectory, name), 'utf8'))).then((files) => files.join('\n')),
  Promise.all(cssNames.map((name) => readFile(resolve(assetDirectory, name), 'utf8'))).then((files) => files.join('\n')),
]);
const failures = [];

if (generation === 'v2') {
  const legacyChunks = javascriptNames.filter((name) => /^(OverviewPage|InstancesPage|ChatsPage|GroupsPage|CampaignsPage|EventsPage|QueuePage|WebhooksPage|SettingsPage|ApiKeysPage)-/.test(name));
  if (legacyChunks.length) failures.push(`legacy chunks shipped in v2: ${legacyChunks.join(', ')}`);
  for (const phrase of ['Queue & Jobs', 'Webhook destinations', 'Global settings', 'API key management']) if (javascript.includes(phrase)) failures.push(`legacy runtime copy shipped in v2: ${phrase}`);
  for (const selector of ['.ui-legacy-root', '.connect-screen', '.events-workspace', '.settings-shell']) if (css.includes(selector)) failures.push(`legacy CSS shipped in v2: ${selector}`);
  for (const expected of ['OverviewPageV2-', 'InstancesPageV2-', 'ConversationsPageV2-', 'GroupsPageV2-', 'CampaignsPageV2-', 'EventsPageV2-']) if (!javascriptNames.some((name) => name.startsWith(expected))) failures.push(`missing v2 route chunk: ${expected}`);
} else {
  if (!css.includes('.connect-screen') || !css.includes('.ui-legacy-root')) failures.push('legacy rollback artifact is missing its presentation compatibility boundary');
  for (const expected of ['QueuePage-', 'WebhooksPage-', 'SettingsPage-', 'ApiKeysPage-']) if (!javascriptNames.some((name) => name.startsWith(expected))) failures.push(`legacy rollback route chunk missing: ${expected}`);
}

if (failures.length) {
  console.error(`${generation} artifact isolation failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else console.log(`${generation} artifact contains only its owned route and presentation generation.`);
