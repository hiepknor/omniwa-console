import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const contractPath = join(root, 'contracts/omniwa-go.openapi.json');
const generatedPath = join(root, 'src/api/generated/schema.d.ts');
const panelsPath = join(root, 'docs/PANELS.md');
const sourceRoot = join(root, 'src');

function fail(message) {
  process.stderr.write(`contract compatibility check failed: ${message}\n`);
  process.exitCode = 1;
}

const contract = JSON.parse(readFileSync(contractPath, 'utf8'));
const specPaths = contract.paths ?? {};
const panels = readFileSync(panelsPath, 'utf8');

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      return /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.test.ts') ? [path] : [];
    }),
  );
  return nested.flat();
}

// Match typed openapi-fetch calls: client.GET('/instance/all'), client.POST('/send/text'), …
const callPattern = /\.(GET|POST|PUT|PATCH|DELETE)\(\s*['"](\/[^'"]*)['"]/g;
const files = await sourceFiles(sourceRoot);
const calls = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(callPattern)) {
    calls.push({ file: relative(root, file), method: match[1], path: match[2] });
  }
}

for (const { file, method, path } of calls) {
  const item = specPaths[path];
  if (!item) {
    fail(`${file} calls ${method} ${path} which is not in the omniwa-go contract`);
    continue;
  }
  if (!item[method.toLowerCase()]) {
    fail(`${file} calls ${method} ${path} but the contract has no ${method} for that path`);
    continue;
  }
  // Panel code (features) must document the operations it uses; infra (app/, api/) need not.
  if (file.startsWith('src/features/') && !panels.includes(`${method} ${path}`)) {
    fail(`docs/PANELS.md does not list ${method} ${path} used by ${file}`);
  }
}

// Freshness: the committed types must match a fresh generation from the contract.
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

if (process.exitCode === undefined || process.exitCode === 0) {
  process.stdout.write(
    `Contract compatibility check passed (${Object.keys(specPaths).length} paths, ${calls.length} typed calls).\n`,
  );
}
