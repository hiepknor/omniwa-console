import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('keeps one semantic title and orders description before actions on narrow screens', () => {
    const html = renderToStaticMarkup(<PageHeader
      eyebrow="Messaging"
      title="Groups"
      description="Inspect projected groups."
      secondaryActions={<Button>Refresh</Button>}
      primaryAction={<Button variant="primary">New group</Button>}
    />);

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html.indexOf('Inspect projected groups.')).toBeLessThan(html.indexOf('Refresh'));
    expect(html.indexOf('Refresh')).toBeLessThan(html.indexOf('New group'));
    expect(html).toContain('sm:grid-cols-[minmax(0,1fr)_auto]');
    expect(html).toContain('sm:row-start-3');
    expect(html).toContain('max-sm:py-2');
  });

  it('aligns title and actions in the first desktop row when no eyebrow is present', () => {
    const html = renderToStaticMarkup(<PageHeader title="Unavailable" primaryAction={<Button>Retry</Button>} />);

    expect(html).toContain('sm:row-start-1');
    expect(html).not.toContain('sm:row-start-3');
  });
});
