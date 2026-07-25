import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CursorPagination } from './CursorPagination';

describe('CursorPagination', () => {
  it('shows only Next page on the first page and disables it without a cursor', () => {
    const html = renderToStaticMarkup(createElement(CursorPagination, { onCursor: () => undefined }));
    expect(html).toContain('First page');
    expect(html).not.toContain('Start over');
    expect(html).toContain('Next page');
    expect(html).toContain('disabled');
  });

  it('offers a reset and an enabled Next page once a cursor and nextCursor exist', () => {
    const html = renderToStaticMarkup(
      createElement(CursorPagination, { cursor: 'c1', nextCursor: 'opaque-2', onCursor: () => undefined }),
    );
    expect(html).toContain('Opaque cursor page');
    expect(html).toContain('Start over');
    expect(html).not.toContain('disabled');
  });

  it('allows a custom label and reset label', () => {
    const html = renderToStaticMarkup(
      createElement(CursorPagination, { cursor: 'c1', nextCursor: null, onCursor: () => undefined, label: 'Generated just now', resetLabel: 'First page' }),
    );
    expect(html).toContain('Generated just now');
    expect(html).toContain('First page');
    expect(html).not.toContain('Opaque cursor page');
  });
});
