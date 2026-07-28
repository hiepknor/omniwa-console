import type { GroupMemberRole, GroupMembershipState, GroupMyRole, GroupSendMode, GroupState, GroupType } from '@/api/groups';
import { readOptionalSearchParam, readSearchText } from '@/lib/url-search-state';

export type GroupWorkspaceTab = 'overview' | 'members' | 'settings' | 'activity';

export const groupTypes: readonly GroupType[] = ['group', 'community', 'subgroup', 'unknown'];
export const groupRoles: readonly GroupMyRole[] = ['owner', 'superadmin', 'admin', 'member', 'not_member', 'unknown'];
export const groupMemberRoles: readonly GroupMemberRole[] = ['owner', 'superadmin', 'admin', 'member'];
export const groupSendModes: readonly GroupSendMode[] = ['all_members', 'admins_only', 'unknown'];
export const groupStates: readonly GroupState[] = ['active', 'suspended', 'dissolved', 'unavailable', 'unknown'];
export const groupMembershipStates: readonly GroupMembershipState[] = ['joined', 'left', 'removed', 'unknown'];

function optionalEnum<const T extends string>(params: URLSearchParams, key: string, values: readonly T[]): T | undefined {
  const value = readOptionalSearchParam(params, key);
  return value && values.includes(value as T) ? value as T : undefined;
}

export function groupRouteState(searchParams: URLSearchParams) {
  const requestedTab = searchParams.get('tab');
  const tab: GroupWorkspaceTab = requestedTab === 'members' || requestedTab === 'settings' || requestedTab === 'activity' ? requestedTab : 'overview';
  return {
    search: readSearchText(searchParams, 'search'),
    type: optionalEnum(searchParams, 'type', groupTypes),
    myRole: optionalEnum(searchParams, 'myRole', groupRoles),
    sendMode: optionalEnum(searchParams, 'sendMode', groupSendModes),
    state: optionalEnum(searchParams, 'state', groupStates),
    membershipState: optionalEnum(searchParams, 'membershipState', groupMembershipStates),
    cursor: readOptionalSearchParam(searchParams, 'cursor'),
    create: searchParams.get('create') === '1',
    join: searchParams.get('join') === '1',
    tab,
    memberSearch: readSearchText(searchParams, 'memberSearch'),
    memberRole: optionalEnum(searchParams, 'memberRole', groupMemberRoles),
    memberCursor: readOptionalSearchParam(searchParams, 'memberCursor'),
    auditCursor: readOptionalSearchParam(searchParams, 'auditCursor'),
  };
}
