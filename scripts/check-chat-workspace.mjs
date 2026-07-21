import { readFile } from 'node:fs/promises';

const chatsPageUrl = new URL('../src/features/chats/ChatsPage.tsx', import.meta.url);
const conversationListUrl = new URL('../src/features/chats/ConversationList.tsx', import.meta.url);
const messageTimelineUrl = new URL('../src/features/chats/MessageTimeline.tsx', import.meta.url);
const visualViewportUrl = new URL('../src/lib/useVisualViewport.ts', import.meta.url);
const consoleCssUrl = new URL('../src/styles/console.css', import.meta.url);

const [chatsPage, conversationList, messageTimeline, visualViewport, consoleCss] = await Promise.all([
  readFile(chatsPageUrl, 'utf8'),
  readFile(conversationListUrl, 'utf8'),
  readFile(messageTimelineUrl, 'utf8'),
  readFile(visualViewportUrl, 'utf8'),
  readFile(consoleCssUrl, 'utf8'),
]);
const failures = [];

for (const contract of [
  "searchParams.get('pane')",
  "requestedPane === 'conversations' || requestedPane === 'context'",
  "next.set('pane', pane)",
  'className="btn sm chat-mobile-back chat-icon-action"',
]) {
  if (!chatsPage.includes(contract)) failures.push(`src/features/chats/ChatsPage.tsx: missing workspace navigation contract ${contract}`);
}

if (chatsPage.includes('chat-pane-switcher') || chatsPage.includes('useState<ChatPane>')) {
  failures.push('src/features/chats/ChatsPage.tsx: pane navigation must remain URL-backed and must not restore the legacy tab switcher');
}

if (conversationList.includes('onOpenThread')) {
  failures.push('src/features/chats/ConversationList.tsx: route navigation must own thread selection');
}

for (const contract of ['<button', 'aria-pressed={selected}', "next.set('pane', 'context')"]) {
  if (!messageTimeline.includes(contract)) failures.push(`src/features/chats/MessageTimeline.tsx: missing message inspection contract ${contract}`);
}

if (messageTimeline.includes('role="button"') || messageTimeline.includes('<article')) {
  failures.push('src/features/chats/MessageTimeline.tsx: selectable messages must remain native buttons');
}

for (const contract of [
  'container-name:chat-workspace',
  '@container chat-workspace (max-width:1079px)',
  '@container chat-workspace (max-width:679px)',
  '[data-context-mode="message"] .thread{display:flex}',
  '.workspace--chats .context-close,.workspace--chats .chat-mobile-back{display:inline-flex}',
  'html.chat-viewport-lock .shell{position:fixed',
  'height:var(--chat-visual-viewport-height,100dvh)',
  '.workspace--chats[data-keyboard-open] .composer{margin-bottom:8px}',
]) {
  if (!consoleCss.includes(contract)) failures.push(`src/styles/console.css: missing adaptive chat workspace contract ${contract}`);
}

for (const contract of ['window.visualViewport', '--chat-visual-viewport-height', 'chat-viewport-lock', 'data-visual-viewport-managed', 'data-keyboard-open']) {
  if (!visualViewport.includes(contract)) failures.push(`src/lib/useVisualViewport.ts: missing keyboard viewport contract ${contract}`);
}

if (consoleCss.includes('--visual-viewport-offset-top') || consoleCss.includes('data-visual-viewport-active')) {
  failures.push('src/styles/console.css: whole-workspace VisualViewport transforms must not return');
}

if (consoleCss.includes('.chat-pane-switcher')) {
  failures.push('src/styles/console.css: legacy chat pane switcher styles must not return');
}

if (failures.length > 0) {
  console.error(`WARP chat workspace contract drift detected:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('WARP chat workspace contract is synchronized.');
}
