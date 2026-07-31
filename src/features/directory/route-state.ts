import { readOptionalSearchParam, readSearchText, updateSearchParams } from '@/lib/url-search-state';

export type DirectoryView = 'contacts' | 'labels';

export function directoryRouteState(searchParams: URLSearchParams) {
  return {
    search: readSearchText(searchParams, 'search').trim(),
    cursor: readOptionalSearchParam(searchParams, 'cursor'),
  };
}

export function updateDirectoryParams(searchParams: URLSearchParams, updates: Record<string, string | undefined>, reset: string[] = []): URLSearchParams {
  return updateSearchParams(searchParams, updates, reset);
}
