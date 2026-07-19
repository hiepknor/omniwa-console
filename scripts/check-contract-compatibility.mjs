import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const contractPath = join(root, 'contracts/omniwa-v1.openapi.json');
const generatedPath = join(root, 'src/api/generated/schema.d.ts');
const panelsPath = join(root, 'docs/PANELS.md');
const apiDirectory = join(root, 'src/api');

function fail(message) {
  process.stderr.write(`contract compatibility check failed: ${message}\n`);
  process.exitCode = 1;
}

const contract = JSON.parse(readFileSync(contractPath, 'utf8'));
const panels = readFileSync(panelsPath, 'utf8');
const operations = [];

for (const [path, pathItem] of Object.entries(contract.paths ?? {})) {
  for (const [method, operation] of Object.entries(pathItem ?? {})) {
    if (!operation || typeof operation !== 'object' || typeof operation.operationId !== 'string') continue;
    operations.push({
      operationId: operation.operationId,
      method: method.toUpperCase(),
      path,
      responses: Object.keys(operation.responses ?? {}),
    });
  }
}

for (const { operationId } of operations) {
  if (!panels.includes(`\`${operationId}\``)) {
    fail(`docs/PANELS.md does not assign ${operationId}`);
  }
}

const apiSources = readdirSync(apiDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
  .map((entry) => ({ name: entry.name, source: readFileSync(join(apiDirectory, entry.name), 'utf8') }));

for (const operation of operations.filter(({ responses }) => responses.includes('200') && responses.includes('202'))) {
  const call = `client.${operation.method}('${operation.path}'`;
  const owner = apiSources.find(({ source }) => source.includes(call));
  if (!owner) continue;

  const callStart = owner.source.indexOf(call);
  const start = owner.source.lastIndexOf('export async function ', callStart);
  const nextFunction = owner.source.indexOf('\nexport async function ', callStart + call.length);
  const functionBody = owner.source.slice(start, nextFunction === -1 ? undefined : nextFunction);
  if (!functionBody.includes('unwrapCommand(')) {
    fail(`${operation.operationId} in src/api/${owner.name} drops its 200/202 command disposition`);
  }
}

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'omniwa-console-contract-'));
const temporaryGenerated = join(temporaryDirectory, basename(generatedPath));
try {
  execFileSync(join(root, 'node_modules/.bin/openapi-typescript'), [contractPath, '-o', temporaryGenerated], {
    cwd: root,
    stdio: 'pipe',
  });
  if (readFileSync(temporaryGenerated, 'utf8') !== readFileSync(generatedPath, 'utf8')) {
    fail('src/api/generated/schema.d.ts is stale; run pnpm api:generate');
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

if (process.exitCode === undefined) {
  process.stdout.write(`Contract compatibility check passed (${operations.length} operations).\n`);
}
