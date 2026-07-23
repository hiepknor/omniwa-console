import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ScopeSelector, StateNotice, Tabs } from './interaction';
import { presentUiState, type UiState } from './state-model';

describe('v2 UI state model', () => {
  it('preserves usable data through syncing, stale, and refresh failures', () => {
    for (const value of [
      { axis: 'projection', state: 'syncing' },
      { axis: 'projection', state: 'stale' },
      { axis: 'resource', state: 'refresh-failed' },
    ] satisfies UiState[]) {
      expect(presentUiState(value).retainsData).toBe(true);
      expect(presentUiState(value).blocking).toBe(false);
    }
  });

  it('keeps authoritative empty distinct from not-started and failed', () => {
    expect(presentUiState({ axis: 'resource', state: 'empty' })).toMatchObject({ title: 'No records', blocking: false, retainsData: false });
    expect(presentUiState({ axis: 'projection', state: 'not-started' }).blocking).toBe(true);
    expect(presentUiState({ axis: 'projection', state: 'failed' }).tone).toBe('failed');
  });

  it('describes acknowledgement without claiming downstream completion', () => {
    const result = presentUiState({ axis: 'command', state: 'acknowledged' });
    expect(result.title).toBe('Command acknowledged by the server');
    expect(result.title.toLowerCase()).not.toContain('delivered');
    expect(result.title.toLowerCase()).not.toContain('completed');
  });

  it('renders state, tabs, and scope with explicit accessible semantics', () => {
    const state = renderToStaticMarkup(createElement(StateNotice, { value: { axis: 'transport', state: 'authentication-failed' }, requestId: 'req_123' }));
    expect(state).toContain('role="alert"');
    expect(state).toContain('data-axis="transport"');
    expect(state).toContain('Request req_123');

    const tabs = renderToStaticMarkup(createElement(Tabs, { label: 'States', selectedId: 'ready', onSelect: () => undefined, items: [{ id: 'ready', label: 'Ready' }, { id: 'stale', label: 'Stale' }] }));
    expect(tabs).toContain('role="tablist"');
    expect(tabs).toContain('aria-selected="true"');
    expect(tabs).toContain('tabindex="-1"');

    const scope = renderToStaticMarkup(createElement(ScopeSelector, { label: 'Active scope', defaultValue: 'admin', children: createElement('option', { value: 'admin' }, 'Platform') }));
    expect(scope).toContain('Active scope');
    expect(scope).toContain('<select');
  });
});
