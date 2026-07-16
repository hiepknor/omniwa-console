# Realtime (SSE)

## Source

`streamEvents` — `GET /v1/events/stream`, `text/event-stream`. This is the
only realtime channel; there are no WebSockets.

## Design: one connection, invalidation only

The console opens **one** SSE connection per session, owned by
`src/api/events.ts`, regardless of how many realtime panels are mounted.

Events are treated as *facts that something changed*, not as data payloads
to merge into caches:

1. An event arrives and is normalized to `{ type, resource, resourceId,
   instanceId?, occurredAt }`.
2. A mapping table translates it to TanStack Query keys to invalidate
   (for example an instance lifecycle event invalidates `['instances']` and
   `['instances', instanceId]`; a queue event invalidates
   `['queue', 'status']` and `['jobs']`).
3. TanStack Query refetches whatever is currently mounted.

This keeps the SSE handler free of merge logic and immune to event-shape
drift: unknown event types fall back to no-op plus the live ticker.

The Overview and Events panels additionally render the raw normalized
events in a bounded ring buffer (last 200) as a live ticker / tail.

## Connection lifecycle

- Native `EventSource` cannot set headers. The platform accepts the API key
  via query parameter for the stream endpoint if supported; otherwise use a
  `fetch`-based SSE reader (ReadableStream parsing) so `x-api-key` rides in
  the header. **The fetch-based reader is the default** — verify against
  the running platform before enabling `EventSource`.
- Reconnect with exponential backoff (1s → 30s cap, jittered). Show a
  "live / reconnecting / offline" indicator in the shell header.
- On reconnect, invalidate all realtime panel keys once, since events were
  missed during the gap.
- Close the connection on disconnect/session clear.

## Degradation

If the stream is unavailable (older platform, proxy stripping SSE), the
console falls back to polling: realtime panels refetch on a 15s interval
while visible. The indicator shows "polling" so operators know freshness.
