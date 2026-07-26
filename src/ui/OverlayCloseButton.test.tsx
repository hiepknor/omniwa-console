import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OverlayCloseButton } from './OverlayCloseButton';

describe('OverlayCloseButton', () => {
  it('renders an explicit, keyboard-focusable close action', () => {
    const html = renderToStaticMarkup(
      <OverlayCloseButton label="Close dialog" onClick={() => undefined} />,
    );

    expect(html).toContain('type="button"');
    expect(html).toContain('aria-label="Close dialog"');
    expect(html).toContain('focus-visible:outline-2');
    expect(html).toContain('motion-reduce:transition-none');
  });

  it('exposes a native disabled state while an overlay command is pending', () => {
    const html = renderToStaticMarkup(
      <OverlayCloseButton label="Close drawer" onClick={() => undefined} disabled />,
    );

    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-label="Close drawer"');
  });
});
