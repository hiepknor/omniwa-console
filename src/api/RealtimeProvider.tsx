import type { ReactNode } from 'react';

/**
 * Realtime is disabled against omniwa-go.
 *
 * omniwa-go's only realtime channel is a WebSocket `/ws` that authenticates with
 * the **global admin key** — a secret that must never be opened directly from a
 * browser SPA (see docs/REALTIME.md and the omniwa-go wiki). Instead of a live
 * stream, panels fall back to REST polling on `REALTIME_REFETCH_INTERVAL`.
 *
 * This module keeps the previous hook surface so feature code and shared
 * components compile unchanged; every hook now reports a steady "polling" state.
 */

export type RealtimeConnectionState = 'connecting' | 'live' | 'reconnecting' | 'polling';

export const REALTIME_REFETCH_INTERVAL = 15_000;

export type NormalizedRealtimeEvent = {
  id: string;
  cursor: string;
  type: string;
  resource: string;
  resourceId?: string;
  instanceId?: string;
  occurredAt: string;
};

const NO_EVENTS: readonly NormalizedRealtimeEvent[] = [];

export function RealtimeProvider(props: {
  session?: { baseUrl: string; apiKey: string };
  onAuthError?: () => void;
  children: ReactNode;
}): JSX.Element {
  return <>{props.children}</>;
}

export function useRealtimeStatus(): RealtimeConnectionState {
  return 'polling';
}

export function useRealtimeStatusOrNull(): RealtimeConnectionState | null {
  return 'polling';
}

export function useRealtimeEvents(): readonly NormalizedRealtimeEvent[] {
  return NO_EVENTS;
}

export function useRealtimeRefetchInterval(): number | false {
  return REALTIME_REFETCH_INTERVAL;
}
