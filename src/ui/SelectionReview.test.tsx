import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SelectionReview } from './SelectionReview';

describe('SelectionReview', () => {
  it('renders cross-page selections with explicit status and removal controls', () => {
    const html = renderToStaticMarkup(<SelectionReview
      title="Selected targets"
      description="Selections can span pages."
      items={[{ id: '120363001@g.us', label: 'Operations', meta: '120363001@g.us', status: 'Unavailable', tone: 'failed', detail: 'Send permission denied' }]}
      onRemove={() => undefined}
    />);

    expect(html).toContain('Selected targets');
    expect(html).toContain('Selections can span pages.');
    expect(html).toContain('Send permission denied');
    expect(html).toContain('data-tone="failed"');
    expect(html).toContain('aria-label="1 selected item"');
    expect(html).toContain('tabular-nums');
    expect(html).toContain('aria-label="Remove selected item Operations"');
  });

  it('omits the surface when there is nothing to review', () => {
    expect(renderToStaticMarkup(<SelectionReview items={[]} onRemove={() => undefined} />)).toBe('');
  });
});
