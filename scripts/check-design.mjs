import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const read = (path) => readFile(resolve(root, path), 'utf8');
const failures = [];

const dialog = await read('src/ui/Dialog.tsx');
for (const marker of ['useModalFocus', 'aria-labelledby', 'aria-busy', 'closeDisabled', 'OverlayCloseButton']) {
  if (!dialog.includes(marker)) failures.push(`src/ui/Dialog.tsx: missing ${marker}`);
}

const drawer = await read('src/ui/Drawer.tsx');
for (const marker of ['useModalFocus', 'aria-labelledby', 'aria-busy', 'closeDisabled', 'OverlayCloseButton']) {
  if (!drawer.includes(marker)) failures.push(`src/ui/Drawer.tsx: missing ${marker}`);
}

const modalFocus = await read('src/ui/useModalFocus.ts');
for (const marker of ["document.body.style.overflow = 'hidden'", 'modalStack.length === 0']) {
  if (!modalFocus.includes(marker)) failures.push(`src/ui/useModalFocus.ts: modal scroll lock is missing ${marker}`);
}

const button = await read('src/ui/Button.tsx');
for (const marker of ['data-variant', 'active:translate-x-px', 'focus-visible:outline-2', 'disabled:pointer-events-none', 'ButtonLink']) {
  if (!button.includes(marker)) failures.push(`src/ui/Button.tsx: action contract is missing ${marker}`);
}

const table = await read('src/ui/Table.tsx');
for (const marker of ['onKeyDown', 'tabIndex', 'aria-selected']) {
  if (!table.includes(marker)) failures.push(`src/ui/Table.tsx: interactive rows are missing ${marker}`);
}

const select = await read('src/ui/Select.tsx');
for (const marker of ['role="combobox"', 'role="listbox"', 'role="option"', 'aria-activedescendant', 'handleKeyDown', 'closeOutside']) {
  if (!select.includes(marker)) failures.push(`src/ui/Select.tsx: custom selector is missing ${marker}`);
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
