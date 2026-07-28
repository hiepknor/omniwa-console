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

  it('can opt into the canonical count badge without changing existing tabs', () => {
    const inlineHtml = renderToStaticMarkup(
      <Tabs active="one" onChange={() => undefined} tabs={[{ id: 'one', label: 'One', count: 12 }]} />,
    );
    const badgeHtml = renderToStaticMarkup(
      <Tabs active="one" countStyle="badge" onChange={() => undefined} tabs={[{ id: 'one', label: 'One', count: 12 }]} />,
    );

    expect(inlineHtml).not.toContain('bg-recessed border border-line');
    expect(badgeHtml).toContain('bg-recessed border border-line');
    expect(badgeHtml).toContain('>12</span>');
  });
});
