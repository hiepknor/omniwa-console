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
for (const marker of ['data-variant', 'shrink-0', 'active:translate-x-px', 'focus-visible:outline-2', 'disabled:pointer-events-none', 'ButtonLink']) {
  if (!button.includes(marker)) failures.push(`src/ui/Button.tsx: action contract is missing ${marker}`);
}

const connectPage = await read('src/app/ConnectPage.tsx');
if (connectPage.includes('font-mono text-[11px] opacity')) {
  failures.push('src/app/ConnectPage.tsx: connection-step labels must retain AA contrast');
}

const closeButton = await read('src/ui/CloseButton.tsx');
for (const marker of ["buttonClassName('ghost'", 'size-9', 'max-sm:size-10', '<Icon name="close"']) {
  if (!closeButton.includes(marker)) failures.push(`src/ui/CloseButton.tsx: close-control contract is missing ${marker}`);
}

const icon = await read('src/ui/Icon.tsx');
for (const marker of ['NavigationIconName', "close: <path", "'chevron-down'", 'signout:', 'strokeWidth="1.75"', 'aria-hidden']) {
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

const apiFailureNotice = await read('src/components/ApiFailureNotice.tsx');
for (const marker of ['rateLimitPresentation', 'scheduleManualRetry', 'ApiFailureNotice', 'Automatic retries are disabled.']) {
  if (!apiFailureNotice.includes(marker)) failures.push(`src/components/ApiFailureNotice.tsx: API failure contract is missing ${marker}`);
}

const uiGallery = await read('src/app/UiGallery.tsx');
if (!uiGallery.includes('<ApiFailureNotice error={galleryRateLimit}')) {
  failures.push('src/app/UiGallery.tsx: locked feedback fixtures must include the shared rate-limit notice');
}
if (!uiGallery.includes("['signout', 'Sign out']")) {
  failures.push('src/app/UiGallery.tsx: locked iconography registry must include Sign out');
}
if (!uiGallery.includes('const sessionUtilityItems') || !uiGallery.includes('Mobile navigation example')) {
  failures.push('src/app/UiGallery.tsx: compact session utilities must remain separate from navigation fixtures');
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
for (const marker of ['appearance-none', 'type="radio"', 'role="switch"', 'indeterminate', 'peer-indeterminate:bg-fg', 'visuallyHiddenLabel', 'max-sm:size-10', 'peer-focus-visible:outline-2', 'max-sm:min-h-10']) {
  if (!choices.includes(marker)) failures.push(`src/ui/ChoiceControls.tsx: choice-control contract is missing ${marker}`);
}

const selectionBar = await read('src/ui/SelectionBar.tsx');
for (const marker of ['role="group"', '<Checkbox', 'indeterminate={indeterminate}', 'selected total', 'selectable on this page', 'Clear selection', 'max-sm:grid-cols-1']) {
  if (!selectionBar.includes(marker)) failures.push(`src/ui/SelectionBar.tsx: selection-bar contract is missing ${marker}`);
}

const selectionReview = await read('src/ui/SelectionReview.tsx');
for (const marker of ['aria-label=', 'aria-live="polite"', 'max-h-56 overflow-y-auto', '<Status', '<Button', 'Remove selected item', 'max-sm:grid-cols-1']) {
  if (!selectionReview.includes(marker)) failures.push(`src/ui/SelectionReview.tsx: retained-selection contract is missing ${marker}`);
}

const tablePrimitive = await read('src/ui/Table.tsx');
for (const marker of ["multiline = false", "multiline && 'py-2'", 'overflow-x-auto', 'border-b border-line', '@container', '@max-[40rem]:block', '@min-[40.0625rem]:@max-[48rem]:hidden', '@min-[40.0625rem]:@max-[60rem]:hidden', 'mobileLabel: string', '[overflow-wrap:anywhere]']) {
  if (!tablePrimitive.includes(marker)) failures.push(`src/ui/Table.tsx: responsive table contract is missing ${marker}`);
}

for (const path of [
  'src/app/UiGallery.tsx',
  'src/features/campaigns/CampaignInspector.tsx',
  'src/features/campaigns/CampaignsView.tsx',
  'src/features/campaigns/CreateCampaign.tsx',
  'src/features/events/EventsView.tsx',
  'src/features/groups/GroupListEditorPage.tsx',
  'src/features/groups/GroupListsPage.tsx',
  'src/features/groups/GroupsView.tsx',
  'src/features/instances/InstancesView.tsx',
  'src/features/platform/OverviewView.tsx',
  'src/features/platform/RecoveryView.tsx',
]) {
  const source = await read(path);
  if (/<T[hd]\b[^>]*\bmax-(?:sm|md|lg|xl|\[)/.test(source)) {
    failures.push(`${path}: table cells must use shared priority instead of feature breakpoints`);
  }
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

const panel = await read('src/ui/Panel.tsx');
for (const marker of ["bodyPadding = 'default'", "'compact-top': 'px-4 pb-4 pt-2'", "none: ''"]) {
  if (!panel.includes(marker)) failures.push(`src/ui/Panel.tsx: controlled body-spacing contract is missing ${marker}`);
}
if (panel.includes('bodyClassName')) {
  failures.push('src/ui/Panel.tsx: uncontrolled bodyClassName can reintroduce conflicting Panel spacing');
}

const metricGrid = await read('src/ui/MetricGrid.tsx');
for (const marker of ["density = 'default'", "frame = 'standalone'", "density === 'compact' ? 'grid-cols-2'", "frame === 'standalone' && 'border-t border-l'", "frame === 'flush-after-content' && 'border-t'", 'break-words']) {
  if (!metricGrid.includes(marker)) failures.push(`src/ui/MetricGrid.tsx: metric composition contract is missing ${marker}`);
}

for (const [path, marker] of Object.entries({
  'src/features/platform/OverviewView.tsx': 'frame="flush"',
  'src/features/instances/CredentialHealth.tsx': "'flush-after-content' : 'flush'",
})) {
  const source = await read(path);
  if (!source.includes(marker) || source.includes('border-t-0 border-l-0')) {
    failures.push(`${path}: full-bleed metrics must use the canonical contextual frame`);
  }
}

if (!uiGallery.includes('Compact full-bleed metrics') || !uiGallery.includes('density="compact"') || !uiGallery.includes('frame="flush"')) {
  failures.push('src/app/UiGallery.tsx: locked metrics fixtures must cover compact full-bleed composition');
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
for (const marker of ['max-[640px]:fixed', 'max-[640px]:bottom-0', 'max-[640px]:pb-[61px]', 'max-[640px]:flex-row', '<NavigationItemContent', 'Compact session utility', 'aria-label="Sign out"']) {
  if (!shell.includes(marker)) failures.push(`src/app/Shell.tsx: responsive shell contract is missing ${marker}`);
}
if (shell.indexOf('Compact session utility') < shell.indexOf('</nav>')) {
  failures.push('src/app/Shell.tsx: compact Sign out utility must remain outside primary navigation');
}

const conversationsPreview = await read('src/app/PreviewConversations.tsx');
for (const marker of ['<main', '<SplitWorkspace', 'detailOpen={Boolean(chat)}', '<WorkspacePaneHeader', '>Back</Button>']) {
  if (!conversationsPreview.includes(marker)) failures.push(`src/app/PreviewConversations.tsx: responsive split-workspace fixture is missing ${marker}`);
}

const splitWorkspace = await read('src/ui/SplitWorkspace.tsx');
for (const marker of ['grid-cols-[320px_minmax(0,1fr)]', 'max-[900px]:grid-cols-1', "detailOpen && 'max-[900px]:hidden'", "!detailOpen && 'max-[900px]:hidden'", 'WorkspacePaneHeader']) {
  if (!splitWorkspace.includes(marker)) failures.push(`src/ui/SplitWorkspace.tsx: split-workspace recipe is missing ${marker}`);
}

const conversationsPage = await read('src/features/conversations/ConversationsPage.tsx');
for (const marker of ['<SplitWorkspace', '<WorkspacePaneHeader', '>Back</Button>']) {
  if (!conversationsPage.includes(marker)) failures.push(`src/features/conversations/ConversationsPage.tsx: production split workspace is missing ${marker}`);
}

const groupsView = await read('src/features/groups/GroupsView.tsx');
for (const marker of ['<FilterToolbar as="form"', '<StateNotice kind="loading"', '<StateNotice kind="empty"']) {
  if (!groupsView.includes(marker)) failures.push(`src/features/groups/GroupsView.tsx: list recipe is missing ${marker}`);
}

const groupListEditor = await read('src/features/groups/GroupListEditorPage.tsx');
for (const marker of ['<SelectionBar', '<SelectionReview', 'Selected targets', 'Select eligible on this page', '<Table', 'border-t-0', 'Selection requires review', 'setPageSelection', '<CursorPagination', '>Members</Th>', '<ProjectedMemberCount', '<GroupTargetIdentity', '<GroupTargetEligibility']) {
  if (!groupListEditor.includes(marker)) failures.push(`src/features/groups/GroupListEditorPage.tsx: target selection recipe is missing ${marker}`);
}
if (groupListEditor.includes('selectedCounts.eligible} eligible ·') || /<Status[^>]*>\{selected\.size\} selected/.test(groupListEditor)) {
  failures.push('src/features/groups/GroupListEditorPage.tsx: selection counts must use SelectionBar rather than a status stamp or zero-bucket sentence');
}

const groupTargetCells = await read('src/features/groups/GroupTargetCells.tsx');
for (const marker of ["formatCount(count)", "'Type unreported'", '[overflow-wrap:anywhere]', 'grid min-w-0 gap-1', 'break-words text-xs leading-4']) {
  if (!groupTargetCells.includes(marker)) failures.push(`src/features/groups/GroupTargetCells.tsx: projected target facts are missing ${marker}`);
}

const instancesPreview = await read('src/app/PreviewInstances.tsx');
if (!instancesPreview.includes('<ConnectionAndPairing') || instancesPreview.includes('ui-qr-sample.svg')) {
  failures.push('src/app/PreviewInstances.tsx: pairing preview must use the production composition and avoid contradictory static QR state');
}

const pairingSurface = await read('src/features/instances/ConnectionAndPairing.tsx');
for (const marker of ['clearPairingQrCache', 'shouldShowPairingQr', 'shouldPollPairingQr', 'title="Connection & pairing"', '<Image', 'No active QR']) {
  if (!pairingSurface.includes(marker)) failures.push(`src/features/instances/ConnectionAndPairing.tsx: pairing contract is missing ${marker}`);
}

const pairingPage = await read('src/features/instances/PairingPage.tsx');
for (const marker of ['title="Instance"', 'whatsappNameWhenLoggedIn', 'label="WhatsApp name"', '<ConnectionAndPairing', '<Status']) {
  if (!pairingPage.includes(marker)) failures.push(`src/features/instances/PairingPage.tsx: direct pairing route is missing ${marker}`);
}
if (pairingPage.includes('label="Runtime name"')) {
  failures.push('src/features/instances/PairingPage.tsx: instance scope must not present status Name as configured runtime identity');
}

for (const path of [
  'src/app/App.tsx',
  'src/app/navigation.tsx',
  'src/features/campaigns/CampaignsPage.tsx',
  'src/features/campaigns/CreateCampaign.tsx',
]) {
  const source = await read(path);
  if (source.includes("'/messages") || source.includes('"/messages')) {
    failures.push(`${path}: Campaigns must use the canonical /campaigns browser route`);
  }
}

const createCampaign = await read('src/features/campaigns/CreateCampaign.tsx');
for (const marker of ['useGroupLists', 'Target Group List', 'Reviewed version', 'groupListVersion', 'aria-live="polite"', 'aria-busy={create.isPending}', 'xl:grid-cols-', 'label="Campaign name" required', 'disabled={!canSubmit}', '<Table>']) {
  if (!createCampaign.includes(marker)) failures.push(`src/features/campaigns/CreateCampaign.tsx: campaign creation recipe is missing ${marker}`);
}
const campaignCancelActions = createCampaign.match(/>Cancel<\/Button>/g) ?? [];
if (createCampaign.includes('max-w-3xl') || createCampaign.includes('<ButtonLink') || campaignCancelActions.length !== 1) {
  failures.push('src/features/campaigns/CreateCampaign.tsx: campaign creation must remain full-width with one pending-aware Cancel action');
}

for (const [path, owner] of Object.entries({
  'src/app/PreviewOverview.tsx': 'OverviewView',
  'src/app/PreviewInstances.tsx': 'InstancesView',
  'src/app/PreviewRecovery.tsx': 'RecoveryView',
  'src/app/PreviewGroups.tsx': 'GroupsView',
  'src/app/PreviewCampaigns.tsx': 'CampaignsView',
  'src/app/PreviewEvents.tsx': 'EventsView',
})) {
  const source = await read(path);
  if (!source.includes(`import { ${owner}`) || !source.includes(`<${owner}`)) {
    failures.push(`${path}: deterministic preview must render its production ${owner}`);
  }
}

const recoveryPreview = await read('src/app/PreviewRecovery.tsx');
const recoveryInspector = await read('src/features/platform/RecoveryInspector.tsx');
for (const marker of ['<RecoveryInspector', '<RecoveryCommandDialog']) {
  if (!recoveryPreview.includes(marker)) failures.push(`src/app/PreviewRecovery.tsx: recovery preview must include shared ${marker.slice(1)}`);
}
for (const marker of ['<Drawer', '<Panel', 'title="Failure facts"', 'label="Event key"', 'title="Recovery actions"', '<Dialog']) {
  if (!recoveryInspector.includes(marker)) failures.push(`src/features/platform/RecoveryInspector.tsx: recovery inspector contract is missing ${marker}`);
}

for (const path of ['src/features/instances/CreateInstance.tsx', 'src/features/instances/InstanceWorkspace.tsx']) {
  const source = await read(path);
  for (const marker of ['Discard without storing…', 'Copying does not confirm durable storage.', 'closeDisabled=']) {
    if (!source.includes(marker)) failures.push(`${path}: one-time secret dismissal contract is missing ${marker}`);
  }
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
