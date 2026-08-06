import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ContactResource } from '@/api/contacts';
import type { LabelResource } from '@/api/labels';
import { DirectoryDetails } from './Details';

const contact: ContactResource = {
  resourceType: 'contact',
  id: 'contact-1',
  aliases: [],
  identityStatus: 'complete',
  displayName: 'Anna Nguyen',
};

const label: LabelResource = { resourceType: 'label', id: 'label-1', name: 'Priority' };

describe('DirectoryDetails', () => {
  it('uses the Drawer body inset once and nests Contact sections beneath the dialog heading', () => {
    const html = renderToStaticMarkup(<DirectoryDetails contact={contact} loading={false} onRetry={() => {}} />);

    expect(html).toContain('class="grid gap-4"');
    expect(html).not.toContain('class="grid gap-4 p-4"');
    expect(html).toContain('<h3 class="text-sm font-semibold text-fg">Canonical identity</h3>');
    expect(html).toContain('<h3 class="text-sm font-semibold text-fg">Labels</h3>');
  });

  it('uses the same inset and heading hierarchy for Label detail', () => {
    const html = renderToStaticMarkup(<DirectoryDetails label={label} loading={false} onRetry={() => {}} />);

    expect(html).toContain('class="grid gap-4"');
    expect(html).not.toContain('class="grid gap-4 p-4"');
    expect(html).toContain('<h3 class="text-sm font-semibold text-fg">Projected definition</h3>');
  });
});
