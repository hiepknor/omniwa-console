import { readOptionalSearchParam, readSearchText } from '@/lib/url-search-state';

export type GroupWorkspaceTab = 'overview' | 'members' | 'settings';

export function groupRouteState(searchParams: URLSearchParams) {
  const requestedTab = searchParams.get('tab');
  const tab: GroupWorkspaceTab = requestedTab === 'members' || requestedTab === 'settings' ? requestedTab : 'overview';
  return {
    search: readSearchText(searchParams, 'search'),
    cursor: readOptionalSearchParam(searchParams, 'cursor'),
    create: searchParams.get('create') === '1',
    tab,
  };
}
