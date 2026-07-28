import { readOptionalSearchParam, readSearchEnum, readSearchText, updateSearchParams } from '@/lib/url-search-state';

export type GroupListTab = 'groups' | 'audit';
export function groupListRouteState(searchParams: URLSearchParams) {
  return {
    search: readSearchText(searchParams, 'search'), cursor: readOptionalSearchParam(searchParams, 'cursor'),
    groupCursor: readOptionalSearchParam(searchParams, 'groupCursor'), auditCursor: readOptionalSearchParam(searchParams, 'auditCursor'),
    groupSearch: readSearchText(searchParams, 'groupSearch'), groupSearchCursor: readOptionalSearchParam(searchParams, 'groupSearchCursor'),
    tab: readSearchEnum(searchParams, 'tab', ['groups', 'audit'], 'groups') as GroupListTab,
  };
}
export function setGroupListParam(params: URLSearchParams, key: string, value?: string) {
  const resets = key === 'search' ? ['cursor'] : key === 'groupSearch' ? ['groupSearchCursor'] : [];
  return updateSearchParams(params, { [key]: value }, resets);
}
