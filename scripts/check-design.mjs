import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const read = (path) => readFile(resolve(root, path), 'utf8');
const failures = [];

const dialog = await read('src/ui/Dialog.tsx');
for (const marker of ['useModalFocus', 'aria-labelledby', 'closeDisabled']) {
  if (!dialog.includes(marker)) failures.push(`src/ui/Dialog.tsx: missing ${marker}`);
}

const drawer = await read('src/ui/Drawer.tsx');
for (const marker of ['useModalFocus', 'aria-labelledby']) {
  if (!drawer.includes(marker)) failures.push(`src/ui/Drawer.tsx: missing ${marker}`);
}

const table = await read('src/ui/Table.tsx');
for (const marker of ['onKeyDown', 'tabIndex', 'aria-selected']) {
  if (!table.includes(marker)) failures.push(`src/ui/Table.tsx: interactive rows are missing ${marker}`);
}

for (const path of [
  'src/features/campaigns/CampaignInspector.tsx',
  'src/features/conversations/Composer.tsx',
  'src/features/groups/CreateGroup.tsx',
  'src/features/groups/GroupWorkspace.tsx',
  'src/features/instances/CreateInstance.tsx',
  'src/features/instances/InstanceWorkspace.tsx',
  'src/features/platform/RecoveryPage.tsx',
]) {
  const source = await read(path);
  if (source.includes('<Dialog') && !source.includes('closeDisabled=')) {
    failures.push(`${path}: command dialog must declare pending close behavior`);
  }
}

if (failures.length) {
  console.error(`Design contract violations:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Design interaction contracts are intact.');
}
