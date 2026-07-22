# Realtime and Durable Recovery

## Current browser posture

The client-only console does not open OmniWA GO's `/ws` connection. That socket
uses the global admin key; exposing it to browser code would give every operator
session full instance-administration authority.

`RealtimeProvider` therefore reports `polling` and supplies a bounded refetch
interval to panels that still use its compatibility hooks. Projection-backed
reads are safe database queries, but polling must remain purposeful and must
never target WhatsApp-live information queries.

## Durable events

`GET /events?type=&limit=&cursor=` is the authoritative history and recovery
source:

- events are persisted before external fan-out;
- cursors are opaque;
- `type` is exact and at most 64 characters;
- the default page size is 50 and maximum is 200;
- retention defaults to 30 days;
- no events are backfilled from before durable persistence was deployed;
- responses expose normalized safe summaries, not raw provider payloads.

The Events panel should use this endpoint for history, audit context, and any
future reconnect recovery. Toast history is not an event store.

## Future live bridge

A browser-safe live channel requires a trusted BFF or a new scoped backend
transport. The bridge would hold/administer server credentials, authenticate the
browser separately, and emit safe normalized events.

When available, the console should:

1. consume live events for low-latency notification;
2. invalidate targeted TanStack Query keys instead of writing provider payloads
   directly into caches;
3. resume durable history from `/events` after disconnect;
4. deduplicate live and durable records by backend identity;
5. keep polling as a bounded fallback, not a simultaneous request storm.

WebSocket reconnect does not define history correctness. `/events` does.
