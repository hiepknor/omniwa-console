import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { projectionAttentionLabel, ProjectionAttentionStatus, ProjectionStatusGroup } from './ProjectionReadState';

describe('ProjectionStatusGroup', () => {
  it('combines only the fully ready happy state while retaining exact scope', () => {
    const html = renderToStaticMarkup(<ProjectionStatusGroup entries={[{ label: 'Conversation', meta: { syncStatus: 'ready', lastSyncedAt: '2026-07-30T08:00:00Z' } }, { label: 'Messages', meta: { syncStatus: 'ready', lastSyncedAt: '2026-07-30T08:01:00Z' } }]} />);
    expect(html).toContain('Conversation + Messages ready');
    expect(html).toContain('Conversation sync ');
    expect(html).toContain('Messages sync ');
    expect(html.match(/data-tone="ok"/g)).toHaveLength(1);
  });

  it('keeps non-ready scopes separate', () => {
    const html = renderToStaticMarkup(<ProjectionStatusGroup entries={[{ label: 'Conversation', meta: { syncStatus: 'ready' } }, { label: 'Messages', meta: { syncStatus: 'stale' } }]} />);
    expect(html).toContain('Conversation projection ready');
    expect(html).toContain('Messages projection stale');
    expect(html).not.toContain('Conversation + Messages ready');
  });

  it('keeps healthy header status quiet while preserving degraded scope labels', () => {
    const readyEntries = [{ label: 'Conversation', meta: { syncStatus: 'ready' as const } }, { label: 'Messages', meta: { syncStatus: 'ready' as const } }];
    const staleEntries = [{ label: 'Conversation', meta: { syncStatus: 'ready' as const } }, { label: 'Messages', meta: { syncStatus: 'stale' as const } }];

    expect(renderToStaticMarkup(<ProjectionAttentionStatus entries={readyEntries} />)).toBe('');
    expect(projectionAttentionLabel(readyEntries)).toBeUndefined();
    expect(renderToStaticMarkup(<ProjectionAttentionStatus entries={staleEntries} />)).toContain('Messages stale');
    expect(projectionAttentionLabel(staleEntries)).toBe('Messages stale');
  });
});
