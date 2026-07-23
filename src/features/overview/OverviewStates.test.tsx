import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ActionRequiredState } from './ActionRequiredState';
import { EventTicker } from './EventTicker';

describe('Overview neutral capability states', () => {
  it('does not imply that an unavailable action queue is empty', () => {
    const html = renderToStaticMarkup(<MemoryRouter><ActionRequiredState /></MemoryRouter>);
    expect(html).toContain('No consolidated action queue is available.');
    expect(html).toContain('Unavailable data is not treated as an empty queue.');
    expect(html).toContain('href="/instances"');
  });

  it('describes polling without claiming a browser realtime connection', () => {
    const html = renderToStaticMarkup(<EventTicker connectionState="polling" />);
    expect(html).toContain('Polling only');
    expect(html).toContain('Browser-safe live events are unavailable.');
    expect(html).toContain('refresh every 30 seconds');
    expect(html).toContain('does not open the admin-key WebSocket');
  });
});
