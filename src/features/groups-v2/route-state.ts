export function groupRouteState(searchParams: URLSearchParams) {
  return {
    search: searchParams.get('search') ?? '',
    cursor: searchParams.get('cursor')?.trim() || undefined,
    create: searchParams.get('create') === '1',
  };
}
