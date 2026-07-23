import { readFile } from 'node:fs/promises';

const paths = {
  workflow: new URL('../.github/workflows/ci.yml', import.meta.url),
  dockerfile: new URL('../Dockerfile', import.meta.url),
  deployment: new URL('../docs/DEPLOYMENT.md', import.meta.url),
  bundleCheck: new URL('./check-bundle.mjs', import.meta.url),
};

const [workflow, dockerfile, deployment, bundleCheck] = await Promise.all(
  Object.values(paths).map((path) => readFile(path, 'utf8')),
);

const failures = [];

for (const required of [
  'generation: [legacy, v2]',
  '--build-arg VITE_CONSOLE_UI_GENERATION="$GENERATION"',
  'cc.onio.console.ui-generation',
  "tag_suffix: '-v2'",
  'scope=console-${{ matrix.generation }}',
  'UI generation: %c%s%c',
]) {
  if (!workflow.includes(required)) failures.push(`CI workflow is missing ${required}`);
}

if (!dockerfile.includes('cc.onio.console.ui-generation="$VITE_CONSOLE_UI_GENERATION"')) {
  failures.push('Docker image does not record the selected UI generation');
}

if (!bundleCheck.includes('Page(?:V2)?-')) {
  failures.push('bundle budget does not recognize both legacy and v2 route chunks');
}

for (const required of ['sha-<revision>-v2', 'repository digest', 'cc.onio.console.ui-generation']) {
  if (!deployment.includes(required)) failures.push(`deployment guidance is missing ${required}`);
}

if (failures.length) {
  console.error(`Dual-generation CI contract failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Dual-generation build, smoke, publish, labels, and deployment evidence are synchronized.');
}
