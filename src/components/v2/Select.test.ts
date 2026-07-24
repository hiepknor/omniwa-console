import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Select } from './Select';

const options = [
  { value: 'scheduled', label: 'Scheduled', description: 'Starts later', meta: '3' },
  { value: 'running', label: 'Running' },
];

describe('Select', () => {
  it('renders a collapsed listbox trigger showing the selected option label', () => {
    const html = renderToStaticMarkup(
      createElement(Select, { label: 'Status', value: 'running', options, onChange: () => undefined }),
    );
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('aria-expanded="false"');
    // The trigger shows the selected option's label, not its value; the menu is
    // portalled and only mounts when open, so it is absent from the collapsed markup.
    expect(html).toContain('ui-v2-select__value">Running');
    expect(html).not.toContain('role="listbox"');
  });

  it('shows an em dash when the value matches no option', () => {
    const html = renderToStaticMarkup(
      createElement(Select, { label: 'Status', value: 'x', options: [], onChange: () => undefined }),
    );
    expect(html).toContain('ui-v2-select__value">—');
  });

  it('respects the disabled prop', () => {
    const html = renderToStaticMarkup(
      createElement(Select, { label: 'Status', value: 'running', options, onChange: () => undefined, disabled: true }),
    );
    expect(html).toContain('disabled');
  });
});
