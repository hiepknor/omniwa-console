import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { DescriptionItem, DescriptionList } from './DescriptionList';
import { FilterChip, FilterToolbar } from './Filters';

describe('composite primitives', () => {
  it('renders semantic, responsive description data', () => {
    const html = renderToStaticMarkup(
      <DescriptionList>
        <DescriptionItem label="Instance ID" mono>inst_01</DescriptionItem>
      </DescriptionList>,
    );

    expect(html).toContain('<dl');
    expect(html).toContain('<dt');
    expect(html).toContain('<dd');
    expect(html).toContain('font-mono');
    expect(html).toContain('max-sm:grid-cols-1');
  });

  it('gives removable filters an explicit accessible name', () => {
    const html = renderToStaticMarkup(
      <FilterToolbar as="form">
        <FilterChip label="Status" value="connected" onRemove={vi.fn()} />
      </FilterToolbar>,
    );

    expect(html).toContain('<form');
    expect(html).toContain('Remove Status filter');
    expect(html).toContain('connected');
    expect(html).toContain('focus-visible:outline-2');
  });
});
