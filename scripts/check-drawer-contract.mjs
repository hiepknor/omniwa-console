import { readdir, readFile } from 'node:fs/promises';

const featuresRoot = new URL('../src/features/', import.meta.url);
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

if (failures.length > 0) {
  console.error(`WARP drawer contract drift detected:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('WARP drawer contract is synchronized.');
}
