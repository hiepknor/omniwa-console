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
});
