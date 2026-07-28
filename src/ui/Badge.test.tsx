import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CountBadge, MetadataBadge } from './Badge';

describe('badges', () => {
  it('formats every quantity through the canonical count treatment', () => {
    const html = renderToStaticMarkup(<CountBadge count={1_284} aria-label="1,284 recipients" />);

    expect(html).toContain('aria-label="1,284 recipients"');
    expect(html).toContain('tabular-nums');
    expect(html).toContain('>1,284</span>');
  });

  it('keeps non-quantity metadata separate from count semantics', () => {
    const html = renderToStaticMarkup(<MetadataBadge>Version 3</MetadataBadge>);

    expect(html).toContain('>Version 3</span>');
    expect(html).not.toContain('tabular-nums');
  });
});
