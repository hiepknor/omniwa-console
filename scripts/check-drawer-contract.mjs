import { readdir, readFile } from 'node:fs/promises';

const featuresRoot = new URL('../src/features/', import.meta.url);
const detailDrawerUrl = new URL('../src/components/drawer/DetailDrawer.tsx', import.meta.url);
const iconButtonUrl = new URL('../src/components/IconButton.tsx', import.meta.url);
const consoleCssUrl = new URL('../src/styles/console.css', import.meta.url);
const entries = await readdir(featuresRoot, { recursive: true });
const featureFiles = entries.filter((path) => path.endsWith('.tsx'));
const drawerFiles = featureFiles.filter((path) => path.endsWith('Drawer.tsx') || path === 'events/EventInspector.tsx');

const failures = [];
for (const path of drawerFiles) {
  const source = await readFile(new URL(path, featuresRoot), 'utf8');
  if (!source.includes("@/components/drawer/DetailDrawer")) {
    failures.push(`src/features/${path}: does not import the shared drawer contract`);
  }
  if (!source.includes('<DetailDrawer')) {
    failures.push(`src/features/${path}: does not render DetailDrawer`);
  }
}

for (const path of featureFiles) {
  const source = await readFile(new URL(path, featuresRoot), 'utf8');
  if (/<aside\b[^>]*className=[^>]*drawer/.test(source)) {
    failures.push(`src/features/${path}: owns drawer shell markup`);
  }
}

const detailDrawerSource = await readFile(detailDrawerUrl, 'utf8');
const iconButtonSource = await readFile(iconButtonUrl, 'utf8');
const consoleCssSource = await readFile(consoleCssUrl, 'utf8');
const sharedHeaderContract = [
  '!grid-cols-[minmax(0,1fr)_auto]',
  'close !col-start-2 !row-start-1',
  '!col-start-2 !row-start-2 !justify-self-end',
  '!col-start-2 !row-start-3 !justify-self-end',
];

for (const contract of sharedHeaderContract) {
  if (!detailDrawerSource.includes(contract)) {
    failures.push(`src/components/drawer/DetailDrawer.tsx: missing shared header contract ${contract}`);
  }
}

if (!iconButtonSource.includes("!h-11 !w-11") || !iconButtonSource.includes("compact ? '!h-8 !w-8'")) {
  failures.push('src/components/IconButton.tsx: drawer controls must retain a 44px target and 32px compact surface');
}

const drawerShellSelectors = ['drawer', 'instances-drawer', 'queue-drawer', 'groups-drawer', 'webhook-drawer', 'event-inspector'];
for (const selector of drawerShellSelectors) {
  const ownedShell = new RegExp(`(?:^|[}])\\s*\\.${selector}\\s*\\{`, 'm');
  if (ownedShell.test(consoleCssSource)) {
    failures.push(`src/styles/console.css: .${selector} must not own drawer shell geometry`);
  }
}

const ownedDescendant = /\.(?:instances-drawer|queue-drawer|groups-drawer|webhook-drawer|event-inspector)\s+\.(?:drawer-head|drawer-scroll|drawer-identity|close)(?:[^,{]*)?\{/;
if (ownedDescendant.test(consoleCssSource)) {
  failures.push('src/styles/console.css: feature CSS must not own shared drawer header, scrolling, identity, or close controls');
}

if (failures.length > 0) {
  console.error(`WARP drawer contract drift detected:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('WARP drawer contract is synchronized.');
}
