import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ContactResource } from '@/api/contacts';
import type { LabelResource } from '@/api/labels';
import { ContactsPage } from './DirectoryPage';

vi.mock('react-dom', async (importOriginal) => ({
  ...await importOriginal<typeof import('react-dom')>(),
  createPortal: (children: React.ReactNode) => children,
}));
Object.defineProperty(globalThis, 'document', { value: { body: {} }, configurable: true });

let advertised = ['contacts_projection', 'labels_projection', 'canonical_contact_identity'];
const useContacts = vi.fn();
const useContact = vi.fn();
const useLabels = vi.fn();
const useLabel = vi.fn();

vi.mock('@/api/ApiProvider', () => ({ useApiSession: () => ({ keyKind: 'api' }) }));
vi.mock('@/api/CapabilitiesProvider', () => ({ useServerCapabilities: () => ({ isPending: false, isError: false, data: { capabilities: advertised } }) }));
vi.mock('./hooks', () => ({
  useContacts: (...args: unknown[]) => useContacts(...args),
  useContact: (...args: unknown[]) => useContact(...args),
  useLabels: (...args: unknown[]) => useLabels(...args),
  useLabel: (...args: unknown[]) => useLabel(...args),
}));

const contact: ContactResource = { resourceType: 'contact', id: 'contact-1', displayName: 'Anna Nguyen', aliases: [], identityStatus: 'complete', found: true };
const labels: LabelResource[] = [
  { resourceType: 'label', id: 'label-1', name: 'Priority' },
  { resourceType: 'label', id: 'label-2', name: 'Follow up' },
];
const idle = { isPending: false, isFetching: false, error: null, data: undefined, refetch: vi.fn() };

function renderRoute(path: string): string {
  return renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><Routes><Route path="/contacts/:contactId?" element={<ContactsPage />} /></Routes></MemoryRouter>);
}

beforeEach(() => {
  advertised = ['contacts_projection', 'labels_projection', 'canonical_contact_identity'];
  vi.clearAllMocks();
  useContacts.mockImplementation((_search, _cursor, enabled) => enabled ? { ...idle, data: { resource: { items: [contact], total: 84, pagination: { nextCursor: null, hasMore: false } }, meta: { syncStatus: 'ready' } } } : idle);
  useContact.mockReturnValue(idle);
  useLabels.mockImplementation((enabled) => enabled ? { ...idle, data: { resource: labels, meta: { syncStatus: 'ready' } } } : idle);
  useLabel.mockReturnValue(idle);
});

describe('ContactsPage', () => {
  it('queries Contacts without fetching the closed Label catalog', () => {
    const html = renderRoute('/contacts');
    expect(useContacts).toHaveBeenCalledWith('', undefined, true, true);
    expect(useLabels).toHaveBeenCalledWith(false);
    expect(html).toContain('>84</span>');
    expect(html).toContain('Search contacts');
    expect(html).toContain('Label catalog');
    expect(html).not.toContain('Label definitions');
  });

  it('keeps Contacts active while the URL-backed Label catalog is open', () => {
    const html = renderRoute('/contacts/contact-1?panel=labels');
    expect(useContacts).toHaveBeenCalledWith('', undefined, true, true);
    expect(useLabels).toHaveBeenCalledWith(true);
    expect(html).toContain('>2</span>');
    expect(html).toContain('Filter labels');
    expect(html).toContain('Anna Nguyen');
  });

  it('does not enable a projection read when its capability is absent', () => {
    advertised = [];
    const html = renderRoute('/contacts');
    expect(useContacts).toHaveBeenCalledWith('', undefined, false, false);
    expect(html).toContain('Projection unavailable');
    expect(html).toContain('disabled=""');
  });

  it('does not let a missing Label capability block Contacts', () => {
    advertised = ['contacts_projection', 'canonical_contact_identity'];
    const html = renderRoute('/contacts?panel=labels');
    expect(useContacts).toHaveBeenCalledWith('', undefined, true, true);
    expect(useLabels).toHaveBeenCalledWith(false);
    expect(html).toContain('Label projection unavailable');
    expect(html).toContain('Anna Nguyen');
  });
});
