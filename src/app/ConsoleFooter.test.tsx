import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ConsoleFooter } from './ConsoleFooter';

describe('ConsoleFooter', () => {
  it('renders one compact main-column runtime status bar', () => {
    const html = renderToStaticMarkup(
      <ConsoleFooter
        environment="Self-hosted"
        scope="Instance scope"
        capabilityLabel="18 capabilities"
        capabilityTone="ok"
        version="dev-2026-07-28"
        revision="revision-01"
      />,
    );

    expect(html).toContain('<footer');
    expect(html).toContain('aria-label="Console runtime context"');
    expect(html).toContain('h-9');
    expect(html).toContain('max-[640px]:hidden');
    expect(html).toContain('Self-hosted');
    expect(html).toContain('Instance scope');
    expect(html).toContain('18 capabilities');
    expect(html).toContain('GO dev-2026-07-28');
    expect(html).toContain('title="revision-01"');
    expect(html).toContain('Memory-only');
  });

  it('omits an unreported backend version without inventing a placeholder', () => {
    const html = renderToStaticMarkup(
      <ConsoleFooter
        environment="Production"
        scope="Admin scope"
        capabilityLabel="Capability discovery failed"
        capabilityTone="failed"
      />,
    );

    expect(html).not.toContain('GO ');
    expect(html).toContain('data-tone="failed"');
  });
});
