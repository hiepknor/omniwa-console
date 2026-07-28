import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { OverviewResource, ServerHealthResource } from '@/api/overview';
import { OverviewView } from './OverviewView';

const overview: OverviewResource = {
  generatedAt: '2026-07-28T12:00:00Z',
  scope: { type: 'server' },
  window: { start: '2026-07-27T12:00:00Z', end: '2026-07-28T12:00:00Z', durationSeconds: 86_400 },
  instances: { total: 3, connected: 2, disconnected: 1 },
  projections: { groups: 12, contacts: 18, chats: 9, messages: 120, events: 44 },
  messages: { total: 120, incoming: 70, outgoing: 50 },
};

const health: ServerHealthResource = {
  generatedAt: '2026-07-28T12:00:00Z',
  api: { status: 'healthy' },
  instances: [{
    instanceId: 'instance-authenticated',
    connection: { status: 'disconnected', connected: false },
    projection: { status: 'ready', byStatus: {}, resources: [] },
    throttling: { status: 'nominal', observed: false, circuitState: 'closed' },
  }],
};

describe('OverviewView header controls', () => {
  it('keeps the metric selector in its owning metrics surface rather than PageHeader', () => {
    const html = renderToStaticMarkup(<OverviewView
      window="24h"
      windowOptions={[{ value: '24h', label: 'Last 24 hours' }]}
      onWindowChange={() => undefined}
      onRefresh={() => undefined}
      refreshing={false}
      initialLoading={false}
      overview={overview}
      recovery="unsupported"
      credentialScope="admin"
    />);
    const pageHeader = html.slice(0, html.indexOf('</header>'));
    const metricsStart = html.indexOf('Persisted metrics');
    const metricsHeader = html.slice(metricsStart, html.indexOf('</header>', metricsStart));

    expect(pageHeader).toContain('Refresh');
    expect(pageHeader).not.toContain('Metric window');
    expect(metricsHeader).toContain('Metric window');
    expect(metricsHeader).toContain('Last 24 hours');
    expect(html).not.toContain('Metric controls');
    expect(html).toContain('grid-cols-2 sm:grid-cols-2 lg:grid-cols-5');
  });

  it('presents authenticated instance context without exposing admin recovery controls', () => {
    const instanceOverview: OverviewResource = {
      ...overview,
      scope: { type: 'instance', instanceId: 'instance-response' },
      instances: { total: 1, connected: 1, disconnected: 0 },
    };
    const html = renderToStaticMarkup(<OverviewView
      window="24h"
      windowOptions={[{ value: '24h', label: 'Last 24 hours' }]}
      onWindowChange={() => undefined}
      onRefresh={() => undefined}
      refreshing={false}
      initialLoading={false}
      health={health}
      overview={instanceOverview}
      recovery="available"
      credentialScope="instance"
      authenticatedInstanceId="instance-authenticated"
    />);

    expect(html).toContain('Instance</span>');
    expect(html).toContain('authenticated instance');
    expect(html).toContain('instance-authenticated');
    expect(html).toContain('font-mono');
    expect(html).toContain('Instances in scope');
    expect(html).toContain('Transport');
    expect(html).toContain('pairing status is reported on the Instance page');
    expect(html).not.toContain('>Connection</th>');
    expect(html).not.toContain('Control plane and instance health');
    expect(html).not.toContain('Recovery');
    expect(html).not.toContain('/recovery');
  });

  it('retains the admin recovery surface only for admin scope', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <OverviewView
          window="24h"
          windowOptions={[]}
          onWindowChange={() => undefined}
          onRefresh={() => undefined}
          refreshing={false}
          initialLoading={false}
          recovery="available"
          credentialScope="admin"
        />
      </MemoryRouter>,
    );

    expect(html).toContain('Recovery');
    expect(html).toContain('Open recovery');
    expect(html).toContain('href="/recovery"');
  });
});
