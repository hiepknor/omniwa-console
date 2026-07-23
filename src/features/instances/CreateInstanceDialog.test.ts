import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CreateInstanceDialog } from './CreateInstanceDialog';

describe('Create instance one-time credential', () => {
  it('removes passive dismissal while the one-time token is visible', () => {
    const html = renderToStaticMarkup(createElement(CreateInstanceDialog, {
      error: undefined,
      isPending: false,
      created: { instanceId: 'instance-1', token: 'one-time-token' },
      onCancel: vi.fn(),
      onCreate: vi.fn(),
    }));

    expect(html).toContain('one-time-token');
    expect(html).toContain('I stored the token');
    expect(html).toContain('backdrop dismissal are disabled');
    expect(html).not.toContain('Close new instance dialog');
  });
});
