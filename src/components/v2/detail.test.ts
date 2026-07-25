import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Fact, RelativeTime } from './detail';

describe('Fact', () => {
  it('renders a dt/dd pair', () => {
    const html = renderToStaticMarkup(createElement(Fact, { label: 'Status', value: 'Running' }));
    expect(html).toContain('<dt>Status</dt>');
    expect(html).toContain('<dd>Running</dd>');
  });
});

describe('RelativeTime', () => {
  it('exposes the absolute value on the time element when present', () => {
    const html = renderToStaticMarkup(createElement(RelativeTime, { value: '2026-07-22T08:00:00Z' }));
    expect(html).toContain('<time');
    expect(html).toContain('dateTime="2026-07-22T08:00:00Z"');
    expect(html).toContain('title="2026-07-22T08:00:00Z"');
  });

  it('renders the fallback when no value is reported', () => {
    const html = renderToStaticMarkup(createElement(RelativeTime, {}));
    expect(html).not.toContain('<time');
    expect(html).toContain('Not reported');
  });
});
