import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button, Field, Status, UiV2Boundary } from './primitives';

describe('v2 UI primitives', () => {
  it('keeps the generation boundary and button intent explicit', () => {
    const button = createElement(Button, { variant: 'danger' }, 'Discard');
    const html = renderToStaticMarkup(createElement(UiV2Boundary, null, button));
    expect(html).toContain('data-ui-generation="v2"');
    expect(html).toContain('ui-v2-button--danger');
    expect(html).toContain('type="button"');
  });

  it('does not communicate status by color alone', () => {
    const html = renderToStaticMarkup(createElement(Status, { tone: 'degraded', children: 'Retrying' }));
    expect(html).toContain('data-tone="degraded"');
    expect(html).toContain('Retrying');
    expect(html).toContain('aria-hidden="true"');
  });

  it('associates field errors with their control', () => {
    const html = renderToStaticMarkup(createElement(Field, { id: 'origin', label: 'API origin', error: 'Origin is required' }));
    expect(html).toContain('for="origin"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="origin-description"');
    expect(html).toContain('id="origin-description"');
  });
});
