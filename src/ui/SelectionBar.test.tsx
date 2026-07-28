import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SelectionBar } from './SelectionBar';

describe('SelectionBar', () => {
  it('distinguishes page scope from the cross-page selected total', () => {
    const html = renderToStaticMarkup(
      <SelectionBar
        scopeLabel="Select eligible on this page"
        selectedCount={12}
        pageSelectedCount={3}
        pageSelectableCount={7}
        checked={false}
        indeterminate
        onTogglePage={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(html).toContain('Select eligible on this page');
    expect(html).toContain('3 of 7 selectable on this page');
    expect(html).toContain('12</strong> selected total');
    expect(html).toContain('aria-checked="mixed"');
    expect(html).toContain('Clear selection');
  });

  it('keeps the zero state compact without a meaningless clear action', () => {
    const html = renderToStaticMarkup(
      <SelectionBar
        scopeLabel="Select eligible on this page"
        selectedCount={0}
        pageSelectedCount={0}
        pageSelectableCount={4}
        checked={false}
        onTogglePage={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(html).toContain('0</strong> selected total');
    expect(html).not.toContain('Clear selection');
  });

  it('supports an explicit unavailable explanation and disables bulk selection', () => {
    const html = renderToStaticMarkup(
      <SelectionBar
        scopeLabel="Bulk selection unavailable"
        scopeDescription="Select groups individually until eligibility preflight is available."
        selectedCount={2}
        pageSelectedCount={0}
        pageSelectableCount={0}
        checked={false}
        disabled
        onTogglePage={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(html).toContain('Select groups individually until eligibility preflight is available.');
    expect((html.match(/disabled=""/g) ?? []).length).toBe(1);
  });
});
