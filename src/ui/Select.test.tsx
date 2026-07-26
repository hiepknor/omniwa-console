import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { findNextEnabledIndex, Select } from './Select';

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
});
