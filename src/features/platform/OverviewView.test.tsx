import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { OverviewResource } from '@/api/overview';
import { OverviewView } from './OverviewView';

const overview: OverviewResource = {
  generatedAt: '2026-07-28T12:00:00Z',
  scope: { type: 'server' },
  window: { start: '2026-07-27T12:00:00Z', end: '2026-07-28T12:00:00Z', durationSeconds: 86_400 },
  instances: { total: 3, connected: 2, disconnected: 1 },
  projections: { groups: 12, contacts: 18, chats: 9, messages: 120, events: 44 },
  messages: { total: 120, incoming: 70, outgoing: 50 },
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
    />);
    const header = html.slice(0, html.indexOf('</header>'));

    expect(header).toContain('Refresh');
    expect(header).not.toContain('Metric window');
    expect(html).toContain('Metric window');
    expect(html).toContain('Last 24 hours');
    expect(html).toContain('border-t');
  });
});
