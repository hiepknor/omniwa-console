import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PagedSection } from './PagedSection';

const children = createElement('p', null, 'Loaded rows');

describe('PagedSection', () => {
  it('shows the initial-loading state while pending', () => {
    const html = renderToStaticMarkup(
      createElement(PagedSection, { pending: true, error: undefined, retry: () => undefined, children }),
    );
    expect(html).toContain('data-state="initial-loading"');
    expect(html).not.toContain('Loaded rows');
  });

  it('renders the children once loaded', () => {
    const html = renderToStaticMarkup(
      createElement(PagedSection, { pending: false, error: undefined, retry: () => undefined, children }),
    );
    expect(html).toContain('Loaded rows');
  });

  it('renders a failure instead of the children on error', () => {
    const html = renderToStaticMarkup(
      createElement(PagedSection, { pending: false, error: new Error('boom'), retry: () => undefined, children }),
    );
    expect(html).not.toContain('Loaded rows');
  });
});
