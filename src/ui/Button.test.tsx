import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { describe, expect, it } from 'vitest';
import { Button, ButtonLink } from './Button';

describe('Button', () => {
  it('defaults to a non-submitting ghost action', () => {
    const html = renderToStaticMarkup(<Button>Refresh</Button>);
    expect(html).toContain('<button');
    expect(html).toContain('type="button"');
    expect(html).toContain('data-variant="ghost"');
    expect(html).toContain('shrink-0');
    expect(html).not.toContain('aria-busy=');
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
    expect(html).toContain('animate-spin');
  });

  it('clears the danger screentone and transitions the hover lift', () => {
    const html = renderToStaticMarkup(<Button variant="danger">Destroy</Button>);

    expect(html).toContain('hover:bg-none');
    expect(html).toContain('transition-[color,background-color,border-color,box-shadow,translate]');
  });
});

describe('ButtonLink', () => {
  it('uses the same action treatment without changing link semantics', () => {
    const html = renderToStaticMarkup(
      <StaticRouter location="/campaigns">
        <ButtonLink to="/messages/new" variant="primary">New campaign</ButtonLink>
      </StaticRouter>,
    );
    expect(html).toContain('<a');
    expect(html).toContain('href="/messages/new"');
    expect(html).toContain('data-variant="primary"');
    expect(html).not.toContain('<button');
  });
});
