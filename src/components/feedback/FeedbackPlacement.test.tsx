import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SurfaceNotice } from './SurfaceNotice';
import { ToastViewport } from './ToastViewport';

describe('feedback placement', () => {
  it('renders an inline workspace notice with its announcement policy', () => {
    const html = renderToStaticMarkup(
      <SurfaceNotice kind="error" title="API unreachable" detail="Retry later." announcement="polite" />,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('border-l-2');
  });

  it('renders the production toast frame in deterministic inline review placement', () => {
    const html = renderToStaticMarkup(
      <ToastViewport
        placement="inline"
        toasts={[{ id: 'error', createdAt: 0, kind: 'error', title: 'Command failed' }]}
        onDismiss={vi.fn()}
      />,
    );
    expect(html).toContain('aria-label="Notifications"');
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('fixed bottom-4');
  });
});
