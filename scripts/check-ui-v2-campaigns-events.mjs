import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('src/app/generation-v2.tsx');
const campaigns = [read('src/features/campaigns-v2/CampaignsPageV2.tsx'), read('src/features/campaigns-v2/CampaignInspectorV2.tsx'), read('src/features/campaigns-v2/CreateCampaignV2.tsx'), read('src/features/campaigns-v2/hooks.ts')].join('\n');
const events = [read('src/features/events-v2/EventsPageV2.tsx'), read('src/features/events-v2/hooks.ts')].join('\n');
const docs = read('docs/UI_V2_GUIDE.md');

const requireText = (value, phrase, label) => { if (!value.includes(phrase)) throw new Error(`${label} must include ${phrase}`); };
requireText(app, "path: '/messages/:campaignId'", 'v2 campaign routes');
requireText(app, 'CampaignsPageV2', 'v2 campaign generation gate');
requireText(app, 'EventsPageV2', 'v2 event generation gate');
requireText(campaigns, 'campaign_orchestration', 'campaign capability gate');
requireText(campaigns, 'does not prove recipient delivery or completion', 'campaign acknowledgement semantics');
requireText(campaigns, 'No one-click retry', 'uncertain command posture');
requireText(events, 'events_projection', 'event capability gate');
requireText(events, 'No historical backfill', 'event retention semantics');
requireText(docs.toLowerCase().replace(/\s+/g, ' '), 'never opens the admin-key websocket', 'event credential boundary');
if (/\bfetch\s*\(/.test(campaigns + events)) throw new Error('v2 features must not call fetch');
if (/\/instance\/all/.test(campaigns + events)) throw new Error('v2 instance-session features must not call /instance/all');
if (/localStorage|sessionStorage|onMutate|optimistic/i.test(campaigns + events)) throw new Error('v2 campaigns/events violate browser state or optimistic boundaries');

console.log('v2 Campaigns and Events remain instance-scoped, URL-addressable, consent-safe, and acknowledgement-safe.');
