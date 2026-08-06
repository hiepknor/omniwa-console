import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders one framed glyph with an accessible name and matching tooltip', () => {
    const html = renderToStaticMarkup(<IconButton icon="panel-right" label="Open contact details" />);

    expect(html).toContain('type="button"');
    expect(html).toContain('aria-label="Open contact details"');
    expect(html).toContain('aria-describedby=');
    expect(html).toContain('role="tooltip"');
    expect(html).toContain('Open contact details');
    expect(html).toContain('size-9');
    expect(html).toContain('max-sm:size-10');
    expect(html).not.toContain('title=');
  });

  it('locks interaction and animates the glyph while busy', () => {
    const html = renderToStaticMarkup(<IconButton icon="copy" label="Copying request ID" busy />);

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('animate-spin');
    expect(html).toContain('motion-reduce:animate-pulse');
  });
});
