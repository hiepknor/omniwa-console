import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PageGuard } from './PageGuard';

describe('PageGuard', () => {
  it('keeps the page identity and maps an invalid session to the session axis', () => {
    const html = renderToStaticMarkup(
      createElement(PageGuard, { eyebrow: 'Messaging', title: 'Groups', state: 'invalid', detail: 'Needs an instance credential.' }),
    );
    expect(html).toContain('Groups');
    expect(html).toContain('data-axis="session"');
    expect(html).toContain('data-state="invalid"');
    expect(html).toContain('Needs an instance credential.');
  });

  it('maps discovering and unsupported to the capability axis', () => {
    const discovering = renderToStaticMarkup(createElement(PageGuard, { eyebrow: 'Platform', title: 'Instances', state: 'discovering' }));
    expect(discovering).toContain('data-axis="capability"');
    expect(discovering).toContain('data-state="discovering"');
    const unsupported = renderToStaticMarkup(createElement(PageGuard, { eyebrow: 'Observability', title: 'Events', state: 'unsupported' }));
    expect(unsupported).toContain('data-axis="capability"');
    expect(unsupported).toContain('data-state="unsupported"');
  });
});
