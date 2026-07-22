import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const contract = JSON.parse(readFileSync(resolve(root, 'contracts/omniwa-go.openapi.json'), 'utf8'));
const failures = [];

function filesBelow(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  });
}

const markdownFiles = [
  resolve(root, 'README.md'),
  resolve(root, 'AGENTS.md'),
  ...filesBelow(resolve(root, 'docs')).filter((path) => extname(path) === '.md'),
  ...filesBelow(resolve(root, 'design')).filter((path) => extname(path) === '.md'),
];

for (const file of markdownFiles) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g, '').split('#')[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    if (!existsSync(resolve(dirname(file), target))) {
      failures.push(`${relative(root, file)} links to missing ${target}`);
    }
  }
}

const retiredDocuments = [
  'CAMPAIGNS_PROPOSAL.md',
  'CHATS_CONTRACT_GAPS.md',
  'HANDOFF_FROM_OMNIWA_GO.md',
  'INSTANCES_CONTRACT_GAPS.md',
  'M6_CONTRACT_GAPS.md',
  'OBSERVABILITY_CONTRACT_GAPS.md',
  'OPS_CONTRACT_GAPS.md',
  'RATE_LIMIT_PROPOSAL.md',
  'WEB_DASHBOARD_PROFILE_PROPOSAL.md',
];
const referenceFiles = [
  ...markdownFiles,
  ...filesBelow(resolve(root, 'design')).filter((path) => extname(path) === '.html'),
];
for (const file of referenceFiles) {
  const source = readFileSync(file, 'utf8');
  for (const retired of retiredDocuments) {
    if (source.includes(retired)) {
      failures.push(`${relative(root, file)} references retired ${retired}`);
    }
  }
}

const panelsPath = resolve(root, 'docs/PANELS.md');
const panels = readFileSync(panelsPath, 'utf8');
for (const line of panels.split('\n')) {
  const match = line.match(/^(GET|POST|PUT|PATCH|DELETE)\s+([^\s#]+)/);
  if (!match) continue;
  const method = match[1].toLowerCase();
  const path = match[2].split('?')[0];
  if (!contract.paths?.[path]?.[method]) {
    failures.push(`docs/PANELS.md lists missing operation ${match[1]} ${path}`);
  }
}

if (failures.length > 0) {
  process.stderr.write(`documentation check failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}

process.stdout.write(`Documentation links and panel operations are synchronized (${markdownFiles.length} Markdown files).\n`);
