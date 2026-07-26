import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Status } from './Status';
import { statusMarkStyle } from './statusMarks';

describe('Status', () => {
  it('renders a framed ink stamp with an explicit tone and label', () => {
    const html = renderToStaticMarkup(<Status tone="failed">Disconnected</Status>);
    expect(html).toContain('data-tone="failed"');
    expect(html).toContain('grid-cols-[20px_minmax(0,1fr)]');
    expect(html).toContain('justify-self-start');
    expect(html).toContain('border-line-strong');
    expect(html).toContain('size-2.5');
    expect(html).toContain('Disconnected');
  });

  it('keeps every semantic tone visually distinct without chroma', () => {
    const patterns = Object.values(statusMarkStyle).map((style) => JSON.stringify(style));
    expect(new Set(patterns)).toHaveLength(6);
    expect(statusMarkStyle.info.background).toContain('to bottom');
    expect(statusMarkStyle.neutral.border).toContain('var(--color-fg-3)');
  });
});
