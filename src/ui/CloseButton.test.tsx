import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CloseButton } from './CloseButton';

describe('CloseButton', () => {
  it('renders the canonical square close action', () => {
    const html = renderToStaticMarkup(
      <CloseButton label="Close dialog" onClick={() => undefined} />,
    );

    expect(html).toContain('type="button"');
    expect(html).toContain('aria-label="Close dialog"');
    expect(html).not.toContain('title="Close dialog"');
    expect(html).toContain('size-9');
    expect(html).toContain('max-sm:size-10');
    expect(html).toContain('border-line-strong');
    expect(html).toContain('hover:bg-elevated');
    expect(html).toContain('hover:-translate-x-px');
    expect(html).toContain('focus-visible:outline-2');
    expect(html).toContain('motion-reduce:transition-none');
  });

  it('exposes a native disabled state while dismissal is locked', () => {
    const html = renderToStaticMarkup(
      <CloseButton label="Close drawer" onClick={() => undefined} disabled />,
    );

    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-label="Close drawer"');
    expect(html).toContain('disabled:cursor-not-allowed');
  });
});
