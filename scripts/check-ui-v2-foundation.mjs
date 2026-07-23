import { readFile } from 'node:fs/promises';

const resources = Object.fromEntries(await Promise.all(Object.entries({
  index: new URL('../src/index.css', import.meta.url),
  tokens: new URL('../src/styles/tokens.css', import.meta.url),
  base: new URL('../src/styles/base.css', import.meta.url),
  v2: new URL('../src/styles/ui-v2.css', import.meta.url),
  prototype: new URL('../design/prototypes/console.css', import.meta.url),
  primitives: new URL('../src/components/v2/primitives.tsx', import.meta.url),
  interaction: new URL('../src/components/v2/interaction.tsx', import.meta.url),
  stateModel: new URL('../src/components/v2/state-model.ts', import.meta.url),
  gallery: new URL('../src/app/UiV2Gallery.tsx', import.meta.url),
  app: new URL('../src/app/App.tsx', import.meta.url),
  shell: new URL('../src/app/Shell.tsx', import.meta.url),
  connect: new URL('../src/app/ConnectPage.tsx', import.meta.url),
}).map(async ([name, url]) => [name, await readFile(url, 'utf8')])));

const failures = [];
const importOrder = ['./styles/tokens.css', './styles/base.css', './styles/console.css', './styles/ui-v2.css'];
let previousIndex = -1;
for (const resource of importOrder) {
  const index = resources.index.indexOf(resource);
  if (index <= previousIndex) failures.push(`src/index.css import order is invalid at ${resource}`);
  previousIndex = index;
}

if (!resources.prototype.startsWith("/* OmniWA Console prototype stylesheet. Tokens come from the runtime source. */\n@import url('../../src/styles/tokens.css');")) {
  failures.push('prototype CSS must import the canonical runtime tokens');
}
if (resources.prototype.includes('--bg:') || resources.prototype.includes('--font-body:')) {
  failures.push('prototype CSS redeclares canonical tokens');
}
for (const token of ['--bg:', '--font-body:', '--space-4:', '--radius-md:', '--focus-ring:']) {
  if (!resources.tokens.includes(token)) failures.push(`canonical token source is missing ${token}`);
}
if (!resources.base.includes('@layer base') || !resources.base.includes('.ui-legacy-root,.ui-legacy-root *')) failures.push('layered reset or explicit legacy compatibility boundary is missing');
if (resources.v2.includes('.btn{') || resources.v2.includes('.card{') || resources.v2.includes('.drawer{')) {
  failures.push('v2 CSS must not reuse legacy geometry selectors');
}
for (const required of ['.ui-v2-root', '.ui-v2-button', '.ui-v2-status', '.ui-v2-surface', '.ui-v2-field', '.ui-v2-table', '@media(max-width:640px)']) {
  if (!resources.v2.includes(required)) failures.push(`v2 stylesheet is missing ${required}`);
}
for (const required of ['data-ui-generation="v2"', 'aria-invalid', 'aria-describedby', 'aria-hidden="true"']) {
  if (!resources.primitives.includes(required)) failures.push(`v2 primitives are missing ${required}`);
}
for (const required of ['Production component gallery', '<PageHeader', '<Surface', '<Field', '<Status', '<StateNotice', '<Tabs', '<ScopeSelector', 'ui-v2-table']) {
  if (!resources.gallery.includes(required)) failures.push(`production component gallery is missing ${required}`);
}
for (const required of ["axis: 'session'", "axis: 'capability'", "axis: 'projection'", "axis: 'resource'", "axis: 'transport'", "axis: 'command'", 'retainsData']) {
  if (!resources.stateModel.includes(required)) failures.push(`shared v2 state model is missing ${required}`);
}
for (const required of ['role="tablist"', 'aria-selected', '<select', 'role="dialog"', 'useModalDialog', 'useDrawerFocus']) {
  if (!resources.interaction.includes(required)) failures.push(`v2 interaction primitives are missing ${required}`);
}
if (!resources.app.includes("import.meta.env.DEV") || !resources.app.includes("path: '/__ui-v2'")) {
  failures.push('v2 gallery must be reachable only through the development route');
}
if (!resources.shell.includes('shell ui-legacy-root') || !resources.connect.includes('connect-screen ui-legacy-root')) {
  failures.push('legacy Shell and Connect must keep the explicit compatibility boundary');
}

if (failures.length > 0) {
  console.error(`v2 foundation drift detected:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('v2 tokens, isolated primitives, and production component gallery are synchronized.');
}
