import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Table, Td, Th, Tr } from './Table';

describe('interactive table rows', () => {
  it('makes selectable rows keyboard-focusable and exposes selection state', () => {
    const html = renderToStaticMarkup(
      <Table><tbody><Tr selected onClick={vi.fn()}><Td mobileLabel="Item">Item</Td></Tr></tbody></Table>,
    );

    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-selected="true"');
  });

  it('owns container breakpoints and exposes compact labels without feature media queries', () => {
    const html = renderToStaticMarkup(
      <Table>
        <thead><tr><Th>Identity</Th><Th priority="supporting">Count</Th><Th priority="detail">Updated</Th></tr></thead>
        <tbody><Tr><Td mobileLabel="Identity">A long operational identity</Td><Td mobileLabel="Count" priority="supporting">42</Td><Td mobileLabel="Updated" priority="detail">Just now</Td></Tr></tbody>
      </Table>,
    );

    expect(html).toContain('@container');
    expect(html).toContain('@max-[40rem]:block');
    expect(html).toContain('@min-[40.0625rem]:@max-[48rem]:hidden');
    expect(html).toContain('@min-[40.0625rem]:@max-[60rem]:hidden');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('Identity');
    expect(html).toContain('[overflow-wrap:anywhere]');
  });
});
