import { readFile } from 'node:fs/promises';
import { allowedClassifications, BACKLOG_DECISIONS, backlogDecisionFor, classifyOperation } from './contract-ui-policy.mjs';

const contract = JSON.parse(await readFile(new URL('../contracts/omniwa-go.openapi.json', import.meta.url), 'utf8'));
const documentedMatrix = await readFile(new URL('../docs/CONTRACT_UI_MATRIX.md', import.meta.url), 'utf8');
const documentedBacklog = await readFile(new URL('../docs/CONTRACT_BACKLOG.md', import.meta.url), 'utf8');
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
  } else {
    const decision = backlogDecisionFor(item.target, item.workflow);
    if (!decision) failures.push(`${item.operation}: no deferred/external decision unit for ${item.target}/${item.workflow}`);
    else if (!documentedBacklog.includes(`- \`${item.operation}\``)) failures.push(`${item.operation}: missing from documented decision unit ${decision.id}`);
  }
}

const decisionIds = new Set();
const decisionKeys = new Set();
for (const decision of BACKLOG_DECISIONS) {
  if (decisionIds.has(decision.id)) failures.push(`duplicate backlog decision id: ${decision.id}`);
  decisionIds.add(decision.id);
  const decisionKey = `${decision.target}/${decision.workflow}`;
  if (decisionKeys.has(decisionKey)) failures.push(`duplicate backlog decision classification: ${decisionKey}`);
  decisionKeys.add(decisionKey);
  const operationsForDecision = operations.filter((item) => item.target === decision.target && item.workflow === decision.workflow);
  if (operationsForDecision.length === 0) failures.push(`${decision.id}: decision unit has no contract operations`);
  const documentedRow = `| \`${decision.id}\` | ${decision.target} | ${decision.owner} | \`${decision.status}\` | ${operationsForDecision.length} |`;
  if (!documentedBacklog.includes(documentedRow)) failures.push(`${decision.id}: backlog register row is missing or stale`);
  const sectionStart = documentedBacklog.indexOf(`### \`${decision.id}\``);
  if (sectionStart === -1) failures.push(`${decision.id}: backlog operation section is missing`);
  const nextSection = sectionStart === -1 ? -1 : documentedBacklog.indexOf('\n### `', sectionStart + 1);
  const decisionSection = sectionStart === -1 ? '' : documentedBacklog.slice(sectionStart, nextSection === -1 ? undefined : nextSection);
  if (!documentedBacklog.includes(decision.exitCriteria)) failures.push(`${decision.id}: exit criteria are missing or stale`);
  for (const item of operationsForDecision) {
    if (!decisionSection.includes(`- \`${item.operation}\``)) failures.push(`${item.operation}: missing from documented decision unit ${decision.id}`);
  }
}

const documentedBacklogOperations = [...documentedBacklog.matchAll(/^- `((?:GET|POST|PUT|PATCH|DELETE) \/[^`]+)`$/gm)].map((match) => match[1]);
const expectedBacklogOperations = operations.filter((item) => item.target !== 'redesign-v2').map((item) => item.operation);
if (documentedBacklogOperations.length !== expectedBacklogOperations.length) {
  failures.push(`documented backlog has ${documentedBacklogOperations.length} operation rows; expected ${expectedBacklogOperations.length}`);
}
for (const operation of new Set([...documentedBacklogOperations, ...expectedBacklogOperations])) {
  const documentedMatches = documentedBacklogOperations.filter((candidate) => candidate === operation).length;
  const expectedMatches = expectedBacklogOperations.filter((candidate) => candidate === operation).length;
  if (documentedMatches !== 1 || expectedMatches !== 1) failures.push(`${operation}: backlog operation is missing, stale, or duplicated`);
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
