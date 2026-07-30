import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProjectionStatusGroup } from './ui';

describe('ProjectionStatusGroup', () => {
  it('combines only the fully ready happy state while retaining exact scope', () => {
    const html = renderToStaticMarkup(<ProjectionStatusGroup entries={[
      { label: 'Conversation', meta: { syncStatus: 'ready', lastSyncedAt: '2026-07-30T08:00:00Z' } },
      { label: 'Messages', meta: { syncStatus: 'ready', lastSyncedAt: '2026-07-30T08:01:00Z' } },
    ]} />);

    expect(html).toContain('Conversation + Messages ready');
    expect(html).toContain('Conversation ');
    expect(html).toContain('Messages ');
    expect(html.match(/data-tone="ok"/g)).toHaveLength(1);
  });

  it('keeps non-ready scopes separate', () => {
    const html = renderToStaticMarkup(<ProjectionStatusGroup entries={[
      { label: 'Conversation', meta: { syncStatus: 'ready' } },
      { label: 'Messages', meta: { syncStatus: 'stale' } },
    ]} />);

    expect(html).toContain('Conversation projection ready');
    expect(html).toContain('Messages projection stale');
    expect(html).not.toContain('Conversation + Messages ready');
  });
});
