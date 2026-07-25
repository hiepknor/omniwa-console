import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CommandAck } from './CommandAck';

describe('CommandAck', () => {
  it('renders a command-acknowledged notice with the standard prefix and the caveat', () => {
    const html = renderToStaticMarkup(
      createElement(CommandAck, { action: 'Token rotation', note: 'Refreshed status remains authoritative.' }),
    );
    expect(html).toContain('data-axis="command"');
    expect(html).toContain('data-state="acknowledged"');
    expect(html).toContain('Token rotation was acknowledged by the server. Refreshed status remains authoritative.');
  });
});
