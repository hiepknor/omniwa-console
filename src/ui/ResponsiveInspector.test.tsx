import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { DOCKED_INSPECTOR_MIN_WIDTH, isDockedInspectorWidth, ResponsiveInspector } from './ResponsiveInspector';

describe('ResponsiveInspector', () => {
  it('docks only when the owning workspace can preserve all three columns', () => {
    expect(isDockedInspectorWidth(DOCKED_INSPECTOR_MIN_WIDTH - 1)).toBe(false);
    expect(isDockedInspectorWidth(DOCKED_INSPECTOR_MIN_WIDTH)).toBe(true);
    expect(isDockedInspectorWidth(1920)).toBe(true);
  });

  it('establishes one named workspace container without server-rendering a persistent modal', () => {
    const html = renderToStaticMarkup(
      <ResponsiveInspector
        open={false}
        persistent
        onClose={vi.fn()}
        title="Conversation details"
        inspector={<p>Canonical identity</p>}
      >
        <main>Conversation workspace</main>
      </ResponsiveInspector>,
    );

    expect(html).toContain('@container/responsive-inspector');
    expect(html).toContain('Conversation workspace');
    expect(html).not.toContain('role="dialog"');
  });
});
