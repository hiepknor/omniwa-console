import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NavigationItemContent, navigationItemClassName } from './NavigationItem';

describe('navigation item', () => {
  it('shares full, compact, and labeled mobile navigation geometry', () => {
    const html = renderToStaticMarkup(<NavigationItemContent icon="overview" label="Overview" />);
    const classes = navigationItemClassName(true);
    expect(html).toContain('Overview');
    expect(html).toContain('max-[640px]:inline');
    expect(classes).toContain('max-[640px]:min-h-11');
    expect(classes).toContain('max-[640px]:flex-col');
    expect(classes).toContain('bg-fg text-bg');
  });
});
