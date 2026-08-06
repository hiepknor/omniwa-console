import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { EventResource } from '@/api/events-api';
import { EventInspector } from './EventsPage';
import { EventsView, historyStatus } from './EventsView';

vi.mock('react-dom', async (importOriginal) => ({
  ...await importOriginal<typeof import('react-dom')>(),
  createPortal: (children: React.ReactNode) => children,
}));
Object.defineProperty(globalThis, 'document', { value: { body: {} }, configurable: true });

const event: EventResource = {
  resourceType: 'event',
  id: 'event:durable/01',
  type: 'message.received',
  occurredAt: '2026-08-06T17:49:43.476Z',
  ingestedAt: '2026-08-06T17:49:44.476Z',
  summary: { conversationId: 'conversation-1', direction: 'incoming' },
};

describe('Events presentation', () => {
  it('reports the actual durable-history polling state', () => {
    expect(historyStatus('active')).toMatchObject({ label: 'Polling durable history', tone: 'ok' });
    expect(historyStatus('refreshing')).toMatchObject({ label: 'Refreshing durable history', tone: 'pending' });
    expect(historyStatus('degraded')).toMatchObject({ label: 'Durable history polling degraded', tone: 'degraded' });
    expect(historyStatus('paused')).toMatchObject({ label: 'Durable history polling paused', tone: 'neutral' });
  });

  it('preserves exact timestamps behind relative table labels', () => {
    const html = renderToStaticMarkup(<EventsView refreshing={false} onRefresh={() => {}} retentionSeconds={604_800} typeDraft="" onTypeDraft={() => {}} onApply={(e) => e.preventDefault()} applyDisabled initialLoading={false} empty={false} items={[event]} onOpen={() => {}} onCursor={() => {}} historyState="active" />);

    expect(html).toContain('dateTime="2026-08-06T17:49:43.476Z"');
    expect(html).toContain('title="2026-08-06T17:49:43.476Z"');
    expect(html).toContain('dateTime="2026-08-06T17:49:44.476Z"');
  });

  it('uses framed fact groups and keeps the durable Event ID copyable', () => {
    const html = renderToStaticMarkup(<EventInspector event={event} onClose={() => {}} />);

    expect(html).toContain('Event facts');
    expect(html).toContain('Safe summary');
    expect(html).toContain('aria-label="Copy Event ID"');
    expect(html).toContain('event:durable/01');
    expect(html.match(/border border-line-strong bg-surface/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
