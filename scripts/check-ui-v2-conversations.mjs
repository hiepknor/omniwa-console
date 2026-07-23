import { readFile } from 'node:fs/promises';

const resources = Object.fromEntries(await Promise.all(Object.entries({
  app: new URL('../src/app/generation-v2.tsx', import.meta.url),
  page: new URL('../src/features/conversations-v2/ConversationsPageV2.tsx', import.meta.url),
  hooks: new URL('../src/features/conversations-v2/hooks.ts', import.meta.url),
  composer: new URL('../src/features/conversations-v2/ComposerV2.tsx', import.meta.url),
  details: new URL('../src/features/conversations-v2/DetailsV2.tsx', import.meta.url),
  route: new URL('../src/features/conversations-v2/route-state.ts', import.meta.url),
  styles: new URL('../src/styles/ui-v2.css', import.meta.url),
}).map(async ([name, url]) => [name, await readFile(url, 'utf8')])));

const failures = [];
for (const required of ['ConversationsPageV2', "path: '/chats/:chatId'", "UI_GENERATION = 'v2'"]) if (!resources.app.includes(required)) failures.push(`v2 route boundary is missing ${required}`);
for (const required of ["keyKind === 'api'", 'chats_projection', 'messages_projection', 'contacts_projection', 'labels_projection', 'outbound_rate_limit', 'No live WhatsApp fallback']) if (!resources.page.includes(required)) failures.push(`Conversations capability/scope behavior is missing ${required}`);
for (const required of ['listChats', 'listMessages', 'listContacts', 'listLabels', 'listMessageReceipts', 'sendTextMessage', 'sendMediaMessage']) if (!resources.hooks.includes(required)) failures.push(`Conversations hooks are missing ${required}`);
if (Object.values(resources).some((source) => source.includes("'/instance/all'"))) failures.push('Conversations v2 must not call GET /instance/all');
for (const required of ['searchParams.get(\'cursor\')', "searchParams.get('messageCursor')", "searchParams.get('message')", "searchParams.get('selected')"]) if (!resources.route.includes(required)) failures.push(`Conversations route state is missing ${required}`);
for (const required of ['acknowledged by the server', 'not WhatsApp delivery', 'Outcome may be uncertain', 'no one-click retry', 'never retains binary or base64']) if (!resources.composer.includes(required)) failures.push(`Bounded send behavior is missing ${required}`);
if (resources.hooks.includes('retry:') || resources.hooks.includes('onMutate') || resources.composer.includes('optimistic')) failures.push('Conversation sends must not retry automatically or update optimistically');
for (const required of ['different projected chat', 'Delivery receipts', 'Projected status is authoritative']) if (!resources.details.includes(required)) failures.push(`Message inspection is missing ${required}`);
for (const required of ['.ui-v2-conversation-workspace', '.ui-v2-resource-list', '.ui-v2-message-list', '.ui-v2-composer', '@media(max-width:900px)']) if (!resources.styles.includes(required)) failures.push(`Conversations responsive styles are missing ${required}`);

if (failures.length) { console.error(`v2 Conversations drift detected:\n- ${failures.join('\n- ')}`); process.exitCode = 1; }
else console.log('v2 Conversations remains instance-scoped, projection-only, URL-addressable, and acknowledgement-safe.');
