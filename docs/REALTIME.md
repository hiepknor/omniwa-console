# Realtime

## Status: disabled (REST polling only)

The console does **not** open a realtime connection against omniwa-go.

omniwa-go's only realtime channel is a WebSocket `/ws` that emits
`{ queue, payload }` frames (`../omniwa-go/docs/wiki-en/websocket-events.md`).
Critically, `/ws` authenticates with the **global admin key** — even when
filtered by `instanceId` — and the omniwa-go wiki explicitly forbids opening it
from a browser SPA, because that would expose the admin secret in front-end code
and in every network request. Safely bridging `/ws` would require a BFF/proxy
that terminates the browser socket and holds the key server-side, which this
client-only console does not have.

## What the console does instead

Panels fall back to **REST polling**. `src/api/RealtimeProvider.tsx` keeps the
previous hook surface (`useRealtimeStatus`, `useRealtimeStatusOrNull`,
`useRealtimeEvents`, `useRealtimeRefetchInterval`) so feature code and shared
components compile unchanged, but:

- `useRealtimeStatus()` / `useRealtimeStatusOrNull()` report a steady `polling`.
- `useRealtimeEvents()` returns an empty list (no live ticker/tail).
- `useRealtimeRefetchInterval()` returns `REALTIME_REFETCH_INTERVAL` (15s), so
  mounted queries refetch on that interval while visible.

The shell indicator therefore shows "polling" and operators know freshness is
bounded by the interval, not live.

## Re-enabling realtime later

If omniwa-go realtime is wanted, add a BFF that proxies `/ws` (browser ↔ BFF
session, BFF ↔ omniwa-go with the global key) and reintroduce a stream client in
`src/api/` that maps `queue` event types to the TanStack Query keys in
`src/api/keys.ts` for targeted invalidation — the same invalidation-only design
the console used for the Platform SSE stream.
