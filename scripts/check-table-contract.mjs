import { readFile } from 'node:fs/promises';

const productionPath = new URL('../src/styles/console.css', import.meta.url);
const prototypePath = new URL('../design/prototypes/console.css', import.meta.url);
const [production, prototype] = await Promise.all([
  readFile(productionPath, 'utf8'),
  readFile(prototypePath, 'utf8'),
]);

const criticalSelectors = [
  '.adaptive-table',
  '.data-table-workspace',
  '.warp-data-table-subtle',
  '.warp-data-table-attached',
  '.warp-data-table-attached>.table-foot',
  '.responsive-table',
  '.responsive-table-layout-compact .responsive-table',
  '.responsive-table-layout-standard .responsive-table',
  '.responsive-table-layout-wide .responsive-table',
  '.responsive-table-column-selection',
  '.responsive-table-column-xs',
  '.responsive-table-column-sm',
  '.responsive-table-column-md',
  '.responsive-table-column-lg',
  '.responsive-table-column-xl',
  '.responsive-table-column-flex',
  '.responsive-table-kind-numeric',
  '.responsive-table-sticky-checkbox',
  '.responsive-table-sticky-after-checkbox',
  '.data-table-selection-control',
  '.mobile-row-summary',
  '.mobile-row-summary.has-selection',
  '.mobile-row-selection',
  '.mobile-row-selection .data-table-selection-control',
  '.mobile-filter-trigger',
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalize(value) {
  return value.replace(/\s+/g, '').replace(/;+$/g, '');
}

function declarations(source, selector) {
  const matches = [];
  const expression = new RegExp(`${escapeRegExp(selector)}\\s*\\{([^{}]*)\\}`, 'g');
  for (const match of source.matchAll(expression)) matches.push(normalize(match[1]));
  return [...new Set(matches)].sort();
}

const failures = [];
for (const selector of criticalSelectors) {
  const expected = declarations(production, selector);
  const actual = declarations(prototype, selector);
  if (expected.length === 0) {
    failures.push(`${selector}: missing from production contract`);
  } else if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(`${selector}: prototype differs from production`);
  }
}

const productionContainers = [...production.matchAll(/@container\s*\(max-width:(\d+)px\)/g)].map((match) => match[1]);
const prototypeContainers = [...prototype.matchAll(/@container\s*\(max-width:(\d+)px\)/g)].map((match) => match[1]);
if (JSON.stringify(prototypeContainers) !== JSON.stringify(productionContainers)) {
  failures.push('container breakpoints: prototype differs from production');
}

if (failures.length > 0) {
  console.error(`WARP table contract drift detected:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('WARP table contract is synchronized.');
}
