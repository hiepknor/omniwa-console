import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Table, Td, Tr } from './Table';

describe('interactive table rows', () => {
  it('makes selectable rows keyboard-focusable and exposes selection state', () => {
    const html = renderToStaticMarkup(
      <Table><tbody><Tr selected onClick={vi.fn()}><Td>Item</Td></Tr></tbody></Table>,
    );

    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-selected="true"');
  });
});
