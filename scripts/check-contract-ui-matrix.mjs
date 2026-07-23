import { readFile } from 'node:fs/promises';
import { allowedClassifications, classifyOperation } from './contract-ui-policy.mjs';

const contract = JSON.parse(await readFile(new URL('../contracts/omniwa-go.openapi.json', import.meta.url), 'utf8'));
const documentedMatrix = await readFile(new URL('../docs/CONTRACT_UI_MATRIX.md', import.meta.url), 'utf8');
const panelOwnership = await readFile(new URL('../docs/PANELS.md', import.meta.url), 'utf8');
const methods = new Set(['get', 'post', 'put', 'delete', 'patch']);
const operations = [];

for (const [path, pathItem] of Object.entries(contract.paths ?? {})) {
  for (const method of Object.keys(pathItem)) {
    if (!methods.has(method)) continue;
    operations.push(classifyOperation(method, path));
  }
}

const failures = [];
const seen = new Set();
for (const item of operations) {
  if (seen.has(item.operation)) failures.push(`duplicate operation: ${item.operation}`);
  seen.add(item.operation);
  for (const field of ['scope', 'mode', 'target']) {
    if (!allowedClassifications[field].has(item[field])) failures.push(`${item.operation}: invalid ${field} ${item[field]}`);
  }
  for (const field of ['capability', 'workflow']) {
    if (!item[field]) failures.push(`${item.operation}: missing ${field}`);
  }
  const documentedRow = `| \`${item.operation}\` | ${item.scope} | \`${item.capability}\` | ${item.mode} | ${item.workflow} | ${item.target} |`;
  if (!documentedMatrix.includes(documentedRow)) failures.push(`${item.operation}: generated documentation row is missing or stale`);
  if (item.target === 'redesign-v2') {
    const [method, path] = item.operation.split(' ');
    const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const ownershipPattern = new RegExp(`${method}\\s+${escapedPath}(?:[?\\s\x60])`);
    if (!ownershipPattern.test(panelOwnership)) failures.push(`${item.operation}: redesign-v2 operation has no PANELS.md owner`);
  }
}

const expectedCount = 119;
if (operations.length !== expectedCount) {
  failures.push(`contract operation count changed from ${expectedCount} to ${operations.length}; review and classify the delta`);
}
const documentedOperations = [...documentedMatrix.matchAll(/^\| `((?:GET|POST|PUT|PATCH|DELETE) \/[^`]+)` \|/gm)].map((match) => match[1]);
if (documentedOperations.length !== operations.length) {
  failures.push(`documented matrix has ${documentedOperations.length} operation rows; expected ${operations.length}`);
}
for (const operation of documentedOperations) {
  if (!seen.has(operation)) failures.push(`documented matrix contains stale operation: ${operation}`);
}

if (failures.length > 0) {
  console.error(`Contract UI matrix check failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  const targets = operations.reduce((groups, item) => {
    (groups[item.target] ??= []).push(item);
    return groups;
  }, {});
  console.log(`Contract UI matrix covers all ${operations.length} operations (${Object.entries(targets).map(([key, value]) => `${key}: ${value.length}`).join(', ')}).`);
}
