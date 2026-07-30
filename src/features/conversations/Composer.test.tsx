import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ComposerUnavailable } from './Composer';

describe('ComposerUnavailable', () => {
  it('renders one compact explanation without disabled send controls', () => {
    const html = renderToStaticMarkup(<ComposerUnavailable detail="No authoritative command target is available." />);

    expect(html).toContain('Sending unavailable');
    expect(html).toContain('No authoritative command target is available.');
    expect(html).not.toContain('<textarea');
    expect(html).not.toContain('Send text');
    expect(html).not.toContain('Image or media');
  });
});
