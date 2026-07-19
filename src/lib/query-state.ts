import { useRef } from 'react';

type ReadQueryState = {
  data: unknown;
  error: unknown;
  isError: boolean;
  isFetching: boolean;
  isLoading: boolean;
};

/** Separate a first-read failure from a failed background refresh. */
export function useResilientReadState(query: ReadQueryState, hasSnapshot = query.data !== undefined) {
  const lastError = useRef<unknown>();

  if (query.isError) {
    lastError.current = query.error;
  } else if (!query.isFetching) {
    lastError.current = undefined;
  }

  const error = query.isError
    ? query.error
    : query.isFetching
      ? lastError.current
      : undefined;

  return {
    error,
    isError: error !== undefined,
    isInitialError: error !== undefined && !hasSnapshot,
    isStaleError: error !== undefined && hasSnapshot,
    isInitialLoading: query.isLoading && error === undefined && !hasSnapshot,
  };
}
