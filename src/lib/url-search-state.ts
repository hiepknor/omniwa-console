export type SearchParamUpdate = string | number | null | undefined;

export function readSearchText(searchParams: URLSearchParams, key: string): string {
  return searchParams.get(key) ?? '';
}

export function readOptionalSearchParam(searchParams: URLSearchParams, key: string): string | undefined {
  return searchParams.get(key)?.trim() || undefined;
}

export function readSearchEnum<const Value extends string>(
  searchParams: URLSearchParams,
  key: string,
  values: readonly Value[],
  fallback: Value,
): Value {
  const value = searchParams.get(key);
  return values.includes(value as Value) ? value as Value : fallback;
}

export function readSearchNumber<const Value extends number>(
  searchParams: URLSearchParams,
  key: string,
  values: readonly Value[],
  fallback: Value,
): Value {
  const value = Number(searchParams.get(key));
  return values.includes(value as Value) ? value as Value : fallback;
}

export function updateSearchParams(
  searchParams: URLSearchParams,
  updates: Readonly<Record<string, SearchParamUpdate>>,
  resetKeys: readonly string[] = [],
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  for (const key of resetKeys) next.delete(key);
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === null || value === '') next.delete(key);
    else next.set(key, String(value));
  }
  return next;
}

export function createSearchParams(
  updates: Readonly<Record<string, SearchParamUpdate>> = {},
): URLSearchParams {
  return updateSearchParams(new URLSearchParams(), updates);
}

export function omitSearchParams(searchParams: URLSearchParams, keys: readonly string[]): URLSearchParams {
  return updateSearchParams(
    searchParams,
    Object.fromEntries(keys.map((key) => [key, undefined])),
  );
}

export function withSearchParams(path: string, searchParams: URLSearchParams): string {
  const search = searchParams.toString();
  return search ? `${path}?${search}` : path;
}
