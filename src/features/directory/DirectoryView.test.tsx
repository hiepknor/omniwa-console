import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ContactResource } from '@/api/contacts';
import { ContactTable } from './DirectoryView';

describe('ContactTable', () => {
  const contact = (found?: boolean): ContactResource => ({ resourceType: 'contact', id: 'contact-1', aliases: [], identityStatus: 'complete', found });

  it('distinguishes an unreported found value from an explicit negative', () => {
    const unreported = renderToStaticMarkup(<ContactTable items={[contact()]} onSelect={() => {}} />);
    const notFound = renderToStaticMarkup(<ContactTable items={[contact(false)]} onSelect={() => {}} />);
    expect(unreported).toContain('Unreported');
    expect(unreported).not.toContain('Not found');
    expect(notFound).toContain('Not found');
  });

  it('uses the canonical backend-reported phone number when a display name is absent', () => {
    const html = renderToStaticMarkup(<ContactTable items={[{ ...contact(), phoneNumber: '+84977450514' }]} onSelect={() => {}} />);

    expect(html).toContain('+84977450514');
    expect(html).not.toContain('Unknown contact');
  });

  it('uses the shared borderless directory-table recipe and nests identity under the Contact name', () => {
    const html = renderToStaticMarkup(<ContactTable className="border-0" items={[contact()]} onSelect={() => {}} />);

    expect(html).toContain('border-0');
    expect(html).toContain('<span class="font-medium">Unknown contact</span>');
    expect(html).toContain('<small class="font-mono text-xs text-fg-3">contact-1</small>');
    expect(html).not.toContain('>Contact ID<');
  });
});
