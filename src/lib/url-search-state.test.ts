import { describe, expect, it } from 'vitest';
import {
  createSearchParams,
  omitSearchParams,
  readOptionalSearchParam,
  readSearchEnum,
  readSearchNumber,
  readSearchText,
  updateSearchParams,
  withSearchParams,
} from './url-search-state';

describe('URL search state', () => {
  it('reads text, trimmed optional values, enums, and bounded numbers', () => {
    const params = new URLSearchParams('search=Ops&type=%20receipt%20&tab=audit&limit=100');
    expect(readSearchText(params, 'search')).toBe('Ops');
    expect(readOptionalSearchParam(params, 'type')).toBe('receipt');
    expect(readSearchEnum(params, 'tab', ['overview', 'audit'], 'overview')).toBe('audit');
    expect(readSearchEnum(params, 'missing', ['overview', 'audit'], 'overview')).toBe('overview');
    expect(readSearchNumber(params, 'limit', [25, 50, 100], 50)).toBe(100);
    expect(readSearchNumber(params, 'unknown', [25, 50, 100], 50)).toBe(50);
  });

  it('applies updates and resets without mutating the source params', () => {
    const source = new URLSearchParams('status=draft&cursor=opaque&selected=item-1');
    const next = updateSearchParams(
      source,
      { status: 'running', page: 2, selected: undefined },
      ['cursor'],
    );
    expect(next.toString()).toBe('status=running&page=2');
    expect(source.toString()).toBe('status=draft&cursor=opaque&selected=item-1');
  });

  it('omits panel-only params and builds stable route URLs', () => {
    const source = new URLSearchParams('search=ops&create=1&cursor=a%2Fb');
    const list = omitSearchParams(source, ['create']);
    expect(withSearchParams('/groups', list)).toBe('/groups?search=ops&cursor=a%2Fb');
    expect(withSearchParams('/groups', new URLSearchParams())).toBe('/groups');
    expect(createSearchParams({ view: 'contacts', empty: undefined }).toString()).toBe('view=contacts');
  });
});
