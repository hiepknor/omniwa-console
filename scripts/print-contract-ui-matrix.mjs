import { readFile } from 'node:fs/promises';
import { classifyOperation } from './contract-ui-policy.mjs';

const contract = JSON.parse(await readFile(new URL('../contracts/omniwa-go.openapi.json', import.meta.url), 'utf8'));
const methods = new Set(['get', 'post', 'put', 'delete', 'patch']);
const rows = [];

for (const [path, pathItem] of Object.entries(contract.paths ?? {})) {
  for (const method of Object.keys(pathItem)) {
    if (!methods.has(method)) continue;
    rows.push(classifyOperation(method, path));
  }
}

rows.sort((left, right) => left.workflow.localeCompare(right.workflow) || left.operation.localeCompare(right.operation));
console.log('| Operation | Scope | Capability | Data/action mode | Target workflow | Decision |');
console.log('| --- | --- | --- | --- | --- | --- |');
for (const row of rows) {
  console.log(`| \`${row.operation}\` | ${row.scope} | \`${row.capability}\` | ${row.mode} | ${row.workflow} | ${row.target} |`);
}
