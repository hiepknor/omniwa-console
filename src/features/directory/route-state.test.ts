import { describe, expect, it } from 'vitest';
import { directoryRouteState, updateDirectoryParams } from './route-state';

describe('Directory route state', () => {
  it('preserves opaque Contact cursors and normalized search text', () => {
    expect(directoryRouteState(new URLSearchParams('search=%20mai%20&cursor=opaque%3A1'))).toEqual({ search: 'mai', cursor: 'opaque:1' });
  });

  it('resets cursor when search scope changes', () => {
    expect(updateDirectoryParams(new URLSearchParams('search=old&cursor=opaque%3A1'), { search: 'new' }, ['cursor']).toString()).toBe('search=new');
  });
});
