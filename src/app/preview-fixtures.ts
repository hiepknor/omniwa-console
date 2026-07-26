/* Dev-only sample data for rendering v3 surfaces without a backend (/__preview). */
import type { InstanceResource } from '@/api/instances';
import type { OverviewResource, ProjectionHealthResource, ServerHealthResource } from '@/api/overview';

const now = Date.now();
const ago = (s: number) => new Date(now - s * 1000).toISOString();

export const overviewFixture: OverviewResource = {
  generatedAt: ago(42),
  scope: { type: 'server' },
  window: { start: ago(86_400), end: ago(0), durationSeconds: 86_400 },
  instances: { total: 18, connected: 15, disconnected: 3 },
  projections: { groups: 214, contacts: 8_642, chats: 1_930, messages: 482_119, events: 91_004 },
  messages: { total: 482_119, incoming: 301_442, outgoing: 180_677 },
};

export const projectionFixture: ProjectionHealthResource = {
  generatedAt: ago(55),
  status: 'degraded',
  total: 6,
  byStatus: { ready: 4, syncing: 1, failed: 1 },
  resources: [
    { resource: 'messages', instanceId: 'inst_01HZX', syncStatus: 'ready', pendingEvents: 0, deadLetterEvents: 0, eventLagSeconds: 1 },
    { resource: 'chats', instanceId: 'inst_01HZX', syncStatus: 'ready', pendingEvents: 3, deadLetterEvents: 0, eventLagSeconds: 2 },
    { resource: 'groups', instanceId: 'inst_02KQP', syncStatus: 'syncing', pendingEvents: 142, deadLetterEvents: 0, eventLagSeconds: 38 },
    { resource: 'contacts', instanceId: 'inst_02KQP', syncStatus: 'ready', pendingEvents: 0, deadLetterEvents: 0, eventLagSeconds: 0 },
    { resource: 'events', instanceId: 'inst_07TMR', syncStatus: 'failed', pendingEvents: 12, deadLetterEvents: 4, eventLagSeconds: 611 },
    { resource: 'messages', instanceId: 'inst_07TMR', syncStatus: 'ready', pendingEvents: 0, deadLetterEvents: 0, eventLagSeconds: 3 },
  ],
};

export const instancesFixture: InstanceResource[] = [
  { id: 'inst_01HZX9Q2', displayName: 'Sales bot', status: 'connected', connected: true, credentialVersion: 3, createdAt: ago(86_400 * 12), jid: '15551230001@s.whatsapp.net' },
  { id: 'inst_02KQP7M4', displayName: 'Support line', status: 'connected', connected: true, credentialVersion: 1, createdAt: ago(86_400 * 5), jid: '15551230002@s.whatsapp.net' },
  { id: 'inst_07TMR3B9', displayName: 'Marketing blast', status: 'disconnected', connected: false, credentialVersion: 2, createdAt: ago(86_400 * 30), jid: undefined },
  { id: 'inst_09WLK1C6', displayName: 'Onboarding', status: 'disconnected', connected: false, createdAt: ago(3600), jid: undefined },
] as unknown as InstanceResource[];

export const healthFixture: ServerHealthResource = {
  generatedAt: ago(30),
  api: { status: 'healthy' },
  instances: [
    { instanceId: 'inst_01HZX', connection: { status: 'connected', connected: true }, projection: { status: 'ready', byStatus: {}, resources: [] }, throttling: { status: 'nominal', observed: false, circuitState: 'closed' } },
    { instanceId: 'inst_02KQP', connection: { status: 'connected', connected: true }, projection: { status: 'syncing', byStatus: {}, resources: [] }, throttling: { status: 'throttled', observed: true, circuitState: 'half-open', retryAfterSeconds: 12 } },
    { instanceId: 'inst_07TMR', connection: { status: 'disconnected', connected: false }, projection: { status: 'failed', byStatus: {}, resources: [] }, throttling: { status: 'nominal', observed: false, circuitState: 'closed' } },
  ],
};
