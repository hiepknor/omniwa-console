export function eventRouteState(searchParams: URLSearchParams) {
  return {
    type: (searchParams.get('type') ?? '').slice(0, 64),
    cursor: searchParams.get('cursor')?.trim() || undefined,
    event: searchParams.get('event')?.trim() || undefined,
  };
}

export function setEventParam(searchParams: URLSearchParams, key: string, value?: string) {
  const next = new URLSearchParams(searchParams);
  if (value) next.set(key, value); else next.delete(key);
  if (key === 'type') {
    next.delete('cursor');
    next.delete('event');
  }
  return next;
}
