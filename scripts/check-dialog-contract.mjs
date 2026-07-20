import { readdir, readFile } from 'node:fs/promises';

const featuresRoot = new URL('../src/features/', import.meta.url);
const modalDialogUrl = new URL('../src/components/dialog/ModalDialog.tsx', import.meta.url);
const typedDialogUrl = new URL('../src/components/TypedConfirmationDialog.tsx', import.meta.url);
const mobileFilterUrl = new URL('../src/components/MobileFilterSheet.tsx', import.meta.url);
const shellUrl = new URL('../src/app/Shell.tsx', import.meta.url);
const modalHookUrl = new URL('../src/components/useModalDialog.ts', import.meta.url);
const consoleCssUrl = new URL('../src/styles/console.css', import.meta.url);

const entries = await readdir(featuresRoot, { recursive: true });
const featureFiles = entries.filter((path) => path.endsWith('.tsx'));
const commandDialogFiles = featureFiles.filter((path) => path.endsWith('Dialog.tsx'));
const failures = [];

for (const path of commandDialogFiles) {
  const source = await readFile(new URL(path, featuresRoot), 'utf8');
  if (!source.includes("@/components/dialog/ModalDialog") || !source.includes('<ModalDialog')) {
    failures.push(`src/features/${path}: does not render the shared command dialog shell`);
  }
}

for (const path of featureFiles) {
  const source = await readFile(new URL(path, featuresRoot), 'utf8');
  if (source.includes('role="dialog"') || /className="[^"]*\boverlay\b/.test(source)) {
    failures.push(`src/features/${path}: owns modal shell markup`);
  }
}

const modalSource = await readFile(modalDialogUrl, 'utf8');
const typedSource = await readFile(typedDialogUrl, 'utf8');
const mobileFilterSource = await readFile(mobileFilterUrl, 'utf8');
const shellSource = await readFile(shellUrl, 'utf8');
const modalHookSource = await readFile(modalHookUrl, 'utf8');
const consoleCssSource = await readFile(consoleCssUrl, 'utf8');

for (const contract of ['max-h-[calc(100dvh-32px)]', 'dialog-body !min-h-0 !flex-1 !overflow-y-auto', '[&_.btn]:!min-h-11', '<IconButton compact']) {
  if (!modalSource.includes(contract)) failures.push(`src/components/dialog/ModalDialog.tsx: missing shared modal contract ${contract}`);
}

if (!typedSource.includes("@/components/dialog/ModalDialog") || !typedSource.includes('<ModalDialog')) {
  failures.push('src/components/TypedConfirmationDialog.tsx: must use ModalDialog');
}

for (const [path, source] of [['src/components/MobileFilterSheet.tsx', mobileFilterSource], ['src/app/Shell.tsx', shellSource]]) {
  if (!source.includes('useModalDialog') || !source.includes('<IconButton')) {
    failures.push(`${path}: modal sheets must share focus behavior and icon controls`);
  }
}

for (const contract of ['active = true', 'returnFocusRef', 'sibling.inert = true', "document.body.style.overflow = 'hidden'"]) {
  if (!modalHookSource.includes(contract)) failures.push(`src/components/useModalDialog.ts: missing modal lifecycle contract ${contract}`);
}

const legacyShell = /(?:^|[}])\s*\.(?:dialog|overlay|settings-dialog-overlay)\s*\{|\.dialog\s+(?:header|footer|\.body)\s*\{/m;
if (legacyShell.test(consoleCssSource)) {
  failures.push('src/styles/console.css: legacy CSS must not own command dialog shell geometry');
}

if (failures.length > 0) {
  console.error(`WARP dialog contract drift detected:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('WARP dialog contract is synchronized.');
}
