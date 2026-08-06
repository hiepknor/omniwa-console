import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ApiFailure } from '@/api/envelopes';
import { EventsPage } from './EventsPage';

const state = vi.hoisted(() => ({
  capabilities: ['events_projection'] as string[],
  error: undefined as unknown,
}));

vi.mock('@/api/ApiProvider', () => ({ useApiSession: () => ({ keyKind: 'api' }) }));
vi.mock('@/api/CapabilitiesProvider', () => ({ useServerCapabilities: () => ({ isPending: false, isError: false, data: { capabilities: state.capabilities } }) }));
vi.mock('./hooks', () => ({
  useEvents: () => ({
    isPending: false,
    isFetching: false,
    error: state.error,
    refetch: vi.fn(),
    data: { resource: { items: [], pagination: { nextCursor: null, hasMore: false } }, meta: { backfill: false } },
  }),
}));

describe('EventsPage state semantics', () => {
  it('does not claim authoritative empty history when capability polling is paused', () => {
    state.capabilities = [];
    state.error = undefined;
    const html = renderToStaticMarkup(<MemoryRouter><EventsPage /></MemoryRouter>);

    expect(html).toContain('Capability changed');
    expect(html).toContain('Durable history polling paused');
    expect(html).not.toContain('No events');
  });

  it('reports a degraded poll without layering an empty result over the stale failure', () => {
    state.capabilities = ['events_projection'];
    state.error = new ApiFailure({ code: 'upstream_failure', error: 'Event projection unavailable.' }, 503, new Headers());
    const html = renderToStaticMarkup(<MemoryRouter><EventsPage /></MemoryRouter>);

    expect(html).toContain('Durable history polling degraded');
    expect(html).toContain('Showing last known data');
    expect(html).not.toContain('No events');
  });
});
