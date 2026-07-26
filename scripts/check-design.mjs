import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const read = (path) => readFile(resolve(root, path), 'utf8');
const failures = [];

const dialog = await read('src/ui/Dialog.tsx');
for (const marker of ['useModalFocus', 'aria-labelledby', 'aria-busy', 'closeDisabled', 'CloseButton']) {
  if (!dialog.includes(marker)) failures.push(`src/ui/Dialog.tsx: missing ${marker}`);
}

const drawer = await read('src/ui/Drawer.tsx');
for (const marker of ['useModalFocus', 'aria-labelledby', 'aria-busy', 'closeDisabled', 'CloseButton']) {
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

const closeButton = await read('src/ui/CloseButton.tsx');
for (const marker of ["buttonClassName('ghost'", 'size-9', 'max-sm:size-10', '<Icon name="close"']) {
  if (!closeButton.includes(marker)) failures.push(`src/ui/CloseButton.tsx: close-control contract is missing ${marker}`);
}

const icon = await read('src/ui/Icon.tsx');
for (const marker of ['NavigationIconName', "close: <path", "'chevron-down'", 'strokeWidth="1.75"', 'aria-hidden']) {
  if (!icon.includes(marker)) failures.push(`src/ui/Icon.tsx: iconography contract is missing ${marker}`);
}

const status = await read('src/ui/Status.tsx');
for (const marker of ['data-tone={tone}', 'grid-cols-[20px_minmax(0,1fr)]', 'justify-self-start', "wrap ? 'w-auto max-w-full' : 'w-max'", "wrap ? 'whitespace-normal break-words' : 'whitespace-nowrap'", 'size-2.5', "tone === 'failed'", 'statusMarkStyle[tone]']) {
  if (!status.includes(marker)) failures.push(`src/ui/Status.tsx: status stamp contract is missing ${marker}`);
}

const statusMarks = await read('src/ui/statusMarks.ts');
for (const marker of ['StatusMarkTone', 'to bottom', 'radial-gradient', 'repeating-linear-gradient', "border: '1px solid var(--color-fg-3)'"]) {
  if (!statusMarks.includes(marker)) failures.push(`src/ui/statusMarks.ts: shared screentone registry is missing ${marker}`);
}

const stateNotice = await read('src/ui/StateNotice.tsx');
if (!stateNotice.includes('statusMarkStyle[markTone[kind]]')) {
  failures.push('src/ui/StateNotice.tsx: notice marks must use the shared screentone registry');
}

const input = await read('src/ui/Input.tsx');
for (const marker of ['aria-describedby', 'aria-invalid', 'aria-required', 'max-sm:h-10']) {
  if (!input.includes(marker)) failures.push(`src/ui/Input.tsx: accessible field contract is missing ${marker}`);
}

const textarea = await read('src/ui/Textarea.tsx');
for (const marker of ['fieldControlClassName', 'resize-y', 'min-h-20']) {
  if (!textarea.includes(marker)) failures.push(`src/ui/Textarea.tsx: textarea contract is missing ${marker}`);
}

const choices = await read('src/ui/ChoiceControls.tsx');
for (const marker of ['appearance-none', 'type="radio"', 'role="switch"', 'peer-focus-visible:outline-2', 'max-sm:min-h-10']) {
  if (!choices.includes(marker)) failures.push(`src/ui/ChoiceControls.tsx: choice-control contract is missing ${marker}`);
}

const descriptionList = await read('src/ui/DescriptionList.tsx');
for (const marker of ['<dl', '<dt', '<dd', 'max-sm:grid-cols-1', 'break-words']) {
  if (!descriptionList.includes(marker)) failures.push(`src/ui/DescriptionList.tsx: semantic fact contract is missing ${marker}`);
}

const filters = await read('src/ui/Filters.tsx');
for (const marker of ['FilterToolbar', 'FilterChip', 'Remove filter', 'sr-only', 'focus-visible:outline-2']) {
  if (!filters.includes(marker)) failures.push(`src/ui/Filters.tsx: filter contract is missing ${marker}`);
}

const progress = await read('src/ui/ProgressBar.tsx');
for (const marker of ['role="progressbar"', 'aria-valuenow', 'aria-valuetext', 'In progress', 'status === \'failed\'']) {
  if (!progress.includes(marker)) failures.push(`src/ui/ProgressBar.tsx: progress contract is missing ${marker}`);
}

const image = await read('src/ui/Image.tsx');
for (const marker of ['alt: string', '<img', 'Loading image…', 'Image unavailable', '<figcaption']) {
  if (!image.includes(marker)) failures.push(`src/ui/Image.tsx: image contract is missing ${marker}`);
}

const dateTime = await read('src/ui/DateTimeInput.tsx');
if (!dateTime.includes('type="datetime-local"')) {
  failures.push('src/ui/DateTimeInput.tsx: local date-time semantics are missing');
}

const feedbackContent = await read('src/components/feedback/FeedbackContent.tsx');
for (const marker of ['<CloseButton', 'statusMarkStyle[markTone[kind]]']) {
  if (!feedbackContent.includes(marker)) failures.push(`src/components/feedback/FeedbackContent.tsx: feedback contract is missing ${marker}`);
}

const toastViewport = await read('src/components/feedback/ToastViewport.tsx');
for (const marker of ['placement', 'onMouseEnter', 'onFocusCapture', 'visibilitychange', 'aria-label="Notifications"']) {
  if (!toastViewport.includes(marker)) failures.push(`src/components/feedback/ToastViewport.tsx: feedback placement contract is missing ${marker}`);
}

const shell = await read('src/app/Shell.tsx');
for (const marker of ['max-[640px]:fixed', 'max-[640px]:bottom-0', 'max-[640px]:pb-[61px]', '<NavigationItemContent']) {
  if (!shell.includes(marker)) failures.push(`src/app/Shell.tsx: responsive shell contract is missing ${marker}`);
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
