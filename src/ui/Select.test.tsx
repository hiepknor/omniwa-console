import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  findNextEnabledIndex,
  getMenuPosition,
  optionMarkerClassName,
  Select,
  selectChevronClassName,
} from './Select';

describe('custom Select', () => {
  it('renders a custom combobox and listbox without a native select', () => {
    const html = renderToStaticMarkup(
      <Select id="scope" name="scope" value="instance" aria-label="Scope">
        <option value="admin">Admin</option>
        <option value="instance">Instance</option>
      </Select>,
    );

    expect(html).not.toContain('<select');
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('role="listbox"');
    expect(html).toContain('aria-label="Scope"');
    expect(html).toContain('role="option"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('type="hidden" name="scope" value="instance"');
  });

  it('exposes disabled and invalid states on the trigger', () => {
    const html = renderToStaticMarkup(
      <Select disabled aria-invalid className="w-48">
        <option value="unavailable">Unavailable</option>
      </Select>,
    );

    expect(html).toContain('data-disabled="true"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('w-48');
  });

  it('uses the field label for both the trigger and popup', () => {
    const html = renderToStaticMarkup(
      <Select aria-labelledby="status-label" value="running">
        <option value="running">Running</option>
      </Select>,
    );

    expect(html.match(/aria-labelledby="status-label"/g)).toHaveLength(2);
  });

  it('keeps active option foreground and background classes unambiguous', () => {
    const html = renderToStaticMarkup(
      <Select value="running">
        <option value="running">Running</option>
      </Select>,
    );

    expect(html).toContain('cursor-pointer select-none bg-fg text-bg');
    expect(html).not.toContain('cursor-pointer select-none text-fg bg-fg text-bg');
  });

  it('keeps open-chevron hover colors on the ink treatment', () => {
    const classes = selectChevronClassName(true);
    expect(classes).toContain('bg-fg text-bg');
    expect(classes).toContain('group-hover:text-bg');
    expect(classes).not.toContain('group-hover:text-fg');
  });

  it('uses mutually exclusive marker colors for active and selected states', () => {
    expect(optionMarkerClassName(true, true)).toContain('border-bg bg-bg');
    expect(optionMarkerClassName(true, false)).toContain('border-bg bg-transparent');
    expect(optionMarkerClassName(false, true)).toContain('border-fg bg-fg');
    expect(optionMarkerClassName(false, false)).toContain('border-fg-3 bg-transparent');
  });

  it('flattens mapped option children used by feature filters', () => {
    const values = ['draft', 'running'];
    const html = renderToStaticMarkup(
      <Select value="running">
        <option value="">All statuses</option>
        {values.map((value) => <option key={value} value={value}>{value}</option>)}
      </Select>,
    );

    expect(html.match(/role="option"/g)).toHaveLength(3);
    expect(html).toContain('running');
  });

  it('wraps keyboard movement and skips disabled options', () => {
    const options = [{ disabled: false }, { disabled: true }, { disabled: false }];
    expect(findNextEnabledIndex(options, 0, 1)).toBe(2);
    expect(findNextEnabledIndex(options, 2, 1)).toBe(0);
    expect(findNextEnabledIndex(options, 0, -1)).toBe(2);
    expect(findNextEnabledIndex([{ disabled: true }], 0, 1)).toBe(-1);
  });

  it('flips and right-aligns the menu near viewport edges', () => {
    expect(getMenuPosition({
      root: { top: 700, right: 980, bottom: 736, left: 820 },
      menu: { width: 240, height: 220 },
      viewport: { width: 1_000, height: 800 },
    })).toEqual({ vertical: 'up', horizontal: 'right' });

    expect(getMenuPosition({
      root: { top: 40, right: 220, bottom: 76, left: 40 },
      menu: { width: 240, height: 220 },
      viewport: { width: 1_000, height: 800 },
    })).toEqual({ vertical: 'down', horizontal: 'left' });
  });
});
