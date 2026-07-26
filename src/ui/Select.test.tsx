import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Select } from './Select';

describe('Select', () => {
  it('keeps native select semantics and forwards form attributes', () => {
    const html = renderToStaticMarkup(
      <Select id="scope" name="scope" defaultValue="instance" aria-label="Scope">
        <option value="admin">Admin</option>
        <option value="instance">Instance</option>
      </Select>,
    );

    expect(html).toContain('<select');
    expect(html).toContain('id="scope"');
    expect(html).toContain('name="scope"');
    expect(html).toContain('aria-label="Scope"');
    expect(html).toContain('value="instance" selected=""');
  });

  it('exposes disabled and invalid states on the native control', () => {
    const html = renderToStaticMarkup(
      <Select disabled aria-invalid className="w-48">
        <option>Unavailable</option>
      </Select>,
    );

    expect(html).toContain('data-disabled="true"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('w-48');
  });
});
