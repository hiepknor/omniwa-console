import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CopyValue } from './CopyValue';

describe('CopyValue', () => {
  it('keeps the diagnostic value visible and gives copying an explicit name', () => {
    const html = renderToStaticMarkup(<CopyValue value="conversation-01" label="Conversation ID" />);

    expect(html).toContain('conversation-01');
    expect(html).toContain('aria-label="Copy Conversation ID"');
    expect(html).toContain('aria-live="polite"');
  });
});
