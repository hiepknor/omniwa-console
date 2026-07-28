import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Tabs } from './Tabs';

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
});
