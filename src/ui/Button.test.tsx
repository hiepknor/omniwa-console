import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button, ButtonLink } from './Button';

describe('Button', () => {
  it('defaults to a non-submitting ghost action', () => {
    const html = renderToStaticMarkup(<Button>Refresh</Button>);
    expect(html).toContain('<button');
    expect(html).toContain('type="button"');
    expect(html).toContain('data-variant="ghost"');
    expect(html).toContain('aria-hidden="true"');
  });

  it('forwards submit, disabled, busy, and variant semantics', () => {
    const html = renderToStaticMarkup(
      <Button type="submit" variant="danger" disabled aria-busy>
        Destroy
      </Button>,
    );
    expect(html).toContain('type="submit"');
    expect(html).toContain('data-variant="danger"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
  });
});

describe('ButtonLink', () => {
  it('uses the same action treatment without changing link semantics', () => {
    const html = renderToStaticMarkup(
      <ButtonLink href="/messages/new" variant="primary">New campaign</ButtonLink>,
    );
    expect(html).toContain('<a');
    expect(html).toContain('href="/messages/new"');
    expect(html).toContain('data-variant="primary"');
    expect(html).not.toContain('<button');
  });
});
