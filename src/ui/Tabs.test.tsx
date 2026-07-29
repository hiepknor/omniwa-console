import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { nextTabId, Tabs } from './Tabs';

describe('Tabs', () => {
  it('allows horizontal overflow without creating a nested vertical scroller', () => {
    const html = renderToStaticMarkup(
      <Tabs active="one" onChange={() => undefined} tabs={[{ id: 'one', label: 'One' }, { id: 'two', label: 'Two' }]} />,
    );

    expect(html).toContain('overflow-x-auto');
    expect(html).toContain('overflow-y-hidden');
  });

  it('uses the canonical count badge for every count-bearing tab', () => {
    const html = renderToStaticMarkup(
      <Tabs active="one" onChange={() => undefined} tabs={[{ id: 'one', label: 'One', count: 1_284 }]} />,
    );

    expect(html).toContain('bg-recessed border border-line');
    expect(html).toContain('tabular-nums');
    expect(html).toContain('>1,284</span>');
  });

  it('uses one roving tab stop and exposes horizontal orientation', () => {
    const html = renderToStaticMarkup(
      <Tabs active="two" onChange={() => undefined} tabs={[{ id: 'one', label: 'One' }, { id: 'two', label: 'Two' }]} />,
    );
    expect(html).toContain('aria-orientation="horizontal"');
    expect(html).toContain('aria-selected="false" tabindex="-1"');
    expect(html).toContain('aria-selected="true" tabindex="0"');
  });

  it('associates tabs with a panel when the caller supplies its ID', () => {
    const html = renderToStaticMarkup(
      <Tabs active="one" onChange={() => undefined} tabs={[{ id: 'one', label: 'One', panelId: 'example-panel' }]} />,
    );
    expect(html).toContain('id="example-panel-one-tab"');
    expect(html).toContain('aria-controls="example-panel"');
  });

  it('wraps arrow navigation and supports Home and End', () => {
    const tabs = [{ id: 'one', label: 'One' }, { id: 'two', label: 'Two' }, { id: 'three', label: 'Three' }];
    expect(nextTabId(tabs, 'one', 'ArrowLeft')).toBe('three');
    expect(nextTabId(tabs, 'three', 'ArrowRight')).toBe('one');
    expect(nextTabId(tabs, 'two', 'Home')).toBe('one');
    expect(nextTabId(tabs, 'two', 'End')).toBe('three');
  });
});
