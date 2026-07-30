import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ContactResource } from '@/api/contacts';
import { ContactList } from './DirectoryView';

describe('ContactList', () => {
  const contact = (found?: boolean): ContactResource => ({ resourceType: 'contact', id: 'contact-1', aliases: [], identityStatus: 'complete', found });

  it('distinguishes an unreported found value from an explicit negative', () => {
    const unreported = renderToStaticMarkup(<ContactList items={[contact()]} onSelect={() => {}} />);
    const notFound = renderToStaticMarkup(<ContactList items={[contact(false)]} onSelect={() => {}} />);
    expect(unreported).toContain('Unreported');
    expect(unreported).not.toContain('Not found');
    expect(notFound).toContain('Not found');
  });
});
