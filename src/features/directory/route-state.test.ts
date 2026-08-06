import { describe, expect, it } from 'vitest';
import { contactRegistryLocation, contactsRouteState, labelCatalogLocation, updateContactsParams } from './route-state';

describe('Contacts route state', () => {
  it('keeps Contact and Label catalog scopes independent', () => {
    expect(contactsRouteState(new URLSearchParams('search=%20mai%20&cursor=opaque%3A1&panel=labels&label=priority&labelSearch=%20vip%20'))).toEqual({
      search: 'mai',
      cursor: 'opaque:1',
      panel: 'labels',
      labelId: 'priority',
      labelSearch: 'vip',
    });
  });

  it('resets cursor when search scope changes', () => {
    expect(updateContactsParams(new URLSearchParams('search=old&cursor=opaque%3A1&panel=labels'), { search: 'new' }, ['cursor']).toString()).toBe('search=new&panel=labels');
  });

  it('keeps Contact and Label drawers mutually exclusive while preserving registry scope', () => {
    const contactLocation = new URLSearchParams('search=mai&cursor=opaque%3A1');
    expect(labelCatalogLocation(contactLocation)).toBe('/contacts?search=mai&cursor=opaque%3A1&panel=labels');

    const labelLocation = new URLSearchParams('search=mai&cursor=opaque%3A1&panel=labels&label=priority&labelSearch=vip');
    expect(contactRegistryLocation(labelLocation)).toBe('/contacts?search=mai&cursor=opaque%3A1');
  });
});
