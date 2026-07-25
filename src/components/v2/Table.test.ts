import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Table, type Column } from './Table';

type Row = { id: string; name: string };
const columns: Array<Column<Row>> = [
  { header: 'Name', cell: (row) => row.name },
  { header: 'ID', label: 'Instance ID', cell: (row) => createElement('span', { className: 'ui-v2-mono' }, row.id) },
];
const rows: Row[] = [{ id: 'a1', name: 'support-vn' }, { id: 'b2', name: 'legacy-bot' }];

describe('Table', () => {
  it('emits the canonical ui-v2-table markup with caption, headers, and data-label cells', () => {
    const html = renderToStaticMarkup(
      createElement(Table<Row>, { columns, rows, rowKey: (r) => r.id, caption: 'Instances', ariaLabel: 'Instance table', className: 'ui-v2-instances-table' }),
    );
    expect(html).toContain('<div class="ui-v2-table-wrap" tabindex="0" aria-label="Instance table">');
    expect(html).toContain('class="ui-v2-table ui-v2-instances-table"');
    expect(html).toContain('<caption class="ui-v2-visually-hidden">Instances</caption>');
    expect(html).toContain('<th>Name</th>');
    // A column may override the compact data-label.
    expect(html).toContain('data-label="Instance ID"');
    expect(html).toContain('data-label="Name"');
    expect(html).toContain('support-vn');
  });

  it('marks the selected row and leaves others unset', () => {
    const html = renderToStaticMarkup(
      createElement(Table<Row>, { columns, rows, rowKey: (r) => r.id, caption: 'c', ariaLabel: 'l', selectedKey: 'b2' }),
    );
    expect(html).toContain('data-selected="true"');
    // Only one row is selected.
    expect(html.match(/data-selected="true"/g)?.length).toBe(1);
  });
});
