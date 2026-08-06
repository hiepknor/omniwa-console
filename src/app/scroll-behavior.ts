import type { NavigationType } from 'react-router-dom';

const listScopeParams: Record<string, readonly string[]> = {
  '/campaigns': ['status', 'cursor'],
  '/conversations': ['search', 'cursor'],
  '/contacts': ['search', 'cursor'],
  '/events': ['type', 'cursor'],
  '/groups': ['search', 'type', 'myRole', 'sendMode', 'state', 'membershipState', 'cursor'],
  '/groups/lists': ['search', 'cursor'],
  '/instances': ['search', 'status'],
  '/overview': ['window'],
  '/recovery': ['instanceId', 'resource', 'cursor', 'limit'],
};

function baseScrollPath(pathname: string): string {
  if (/^\/conversations\/[^/]+$/.test(pathname)) return '/conversations';
  if (/^\/contacts\/[^/]+$/.test(pathname)) return '/contacts';
  if (/^\/instances\/[^/]+$/.test(pathname)) return '/instances';
  if (/^\/campaigns\/[^/]+$/.test(pathname) && pathname !== '/campaigns/new') return '/campaigns';
  // Match the nested collection before the generic `/groups/:groupId` route.
  // Otherwise `lists` is mistaken for a Group ID and switching sections keeps
  // the previous page's scroll position.
  if (pathname === '/groups/lists') return pathname;
  if (/^\/groups\/lists\/[^/]+$/.test(pathname) && pathname !== '/groups/lists/new') return '/groups/lists';
  if (/^\/groups\/[^/]+$/.test(pathname)) return '/groups';
  return pathname;
}

/**
 * Keeps each list and its detail routes in one viewport scope while still
 * treating filter and cursor changes as new reading contexts.
 */
export function mainScrollScope(pathname: string, search: string): string {
  const basePath = baseScrollPath(pathname);
  const allowedParams = listScopeParams[basePath];
  if (!allowedParams) return `${pathname}${search}`;

  const source = new URLSearchParams(search);
  const scoped = new URLSearchParams();
  allowedParams.forEach((key) => {
    source.getAll(key).forEach((value) => scoped.append(key, value));
  });
  const suffix = scoped.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export function scrollTopForNavigation({
  navigationType,
  previousScope,
  nextScope,
  currentTop,
  savedTop,
}: {
  navigationType: NavigationType;
  previousScope: string;
  nextScope: string;
  currentTop: number;
  savedTop?: number;
}): number {
  if (navigationType === 'POP' && savedTop !== undefined) return savedTop;
  return previousScope === nextScope ? currentTop : 0;
}

export function horizontalRevealScrollLeft(
  currentScrollLeft: number,
  container: Pick<DOMRect, 'left' | 'right'>,
  item: Pick<DOMRect, 'left' | 'right'>,
): number {
  if (item.left < container.left) return Math.max(0, currentScrollLeft - (container.left - item.left));
  if (item.right > container.right) return currentScrollLeft + (item.right - container.right);
  return currentScrollLeft;
}
