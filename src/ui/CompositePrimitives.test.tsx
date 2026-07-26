import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { DescriptionItem, DescriptionList } from './DescriptionList';
import { FilterChip, FilterToolbar } from './Filters';
import { SplitWorkspace, WorkspacePaneHeader } from './SplitWorkspace';

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
    expect(html).toContain('Remove filter');
    expect(html).not.toContain('aria-label=');
    expect(html).toContain('connected');
    expect(html).toContain('focus-visible:outline-2');
  });

  it('keeps directory and detail in one responsive workspace contract', () => {
    const html = renderToStaticMarkup(
      <SplitWorkspace
        detailOpen
        directoryLabel="Chats"
        detailLabel="Timeline"
        directory={<WorkspacePaneHeader title="Chats" />}
        detail={<WorkspacePaneHeader title="chat_01" description="Projected history" />}
        detailFooter={<button type="button">Send</button>}
      />,
    );

    expect(html).toContain('aria-label="Chats"');
    expect(html).toContain('aria-label="Timeline"');
    expect(html).toContain('max-[900px]:hidden');
    expect(html).toContain('grid-cols-[320px_minmax(0,1fr)]');
    expect(html).toContain('Projected history');
  });
});
