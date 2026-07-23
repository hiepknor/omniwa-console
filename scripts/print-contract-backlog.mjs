import { readFile } from 'node:fs/promises';
import { BACKLOG_DECISIONS, classifyOperation } from './contract-ui-policy.mjs';

const contract = JSON.parse(await readFile(new URL('../contracts/omniwa-go.openapi.json', import.meta.url), 'utf8'));
const methods = new Set(['get', 'post', 'put', 'delete', 'patch']);
const operations = [];

for (const [path, pathItem] of Object.entries(contract.paths ?? {})) {
  for (const method of Object.keys(pathItem)) {
    if (!methods.has(method)) continue;
    const operation = classifyOperation(method, path);
    if (operation.target !== 'redesign-v2') operations.push(operation);
  }
}

console.log('## Decision units\n');
console.log('| Decision unit | Classification | Accountable role | Status | Operations |');
console.log('| --- | --- | --- | --- | ---: |');
for (const decision of BACKLOG_DECISIONS) {
  const count = operations.filter((item) => item.target === decision.target && item.workflow === decision.workflow).length;
  console.log(`| \`${decision.id}\` | ${decision.target} | ${decision.owner} | \`${decision.status}\` | ${count} |`);
}

console.log('\n## Operation membership and exit criteria');
for (const decision of BACKLOG_DECISIONS) {
  const members = operations
    .filter((item) => item.target === decision.target && item.workflow === decision.workflow)
    .sort((left, right) => left.operation.localeCompare(right.operation));
  console.log(`\n### \`${decision.id}\`\n`);
  console.log(`Exit: ${decision.exitCriteria}\n`);
  for (const item of members) console.log(`- \`${item.operation}\``);
}
