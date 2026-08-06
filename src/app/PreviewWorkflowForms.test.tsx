import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PreviewWorkflowForms } from './PreviewWorkflowForms';

describe('PreviewWorkflowForms', () => {
  it('covers both dense workflow compositions with responsive actions and full target identifiers', () => {
    const html = renderToStaticMarkup(<PreviewWorkflowForms />);

    expect(html).toContain('Create campaign draft');
    expect(html).toContain('Edit Group List');
    expect(html).toContain('max-sm:flex-1');
    expect(html).toContain('120363000001@g.us');
    expect(html).toContain('[overflow-wrap:anywhere]');
  });
});
