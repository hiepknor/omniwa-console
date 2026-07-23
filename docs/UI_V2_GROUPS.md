# UI v2 Groups

This vertical slice replaces the complete Groups journey when the exact
build-time UI generation is `v2`. Legacy Production remains unchanged until
the final cutover.

## Session, route, and projection model

Group APIs are instance-token scoped. V2 requires an instance credential and
uses the authenticated session as its query scope. It never calls
`/instance/all`, asks for an instance ID, or falls back to a live WhatsApp group
lookup. Admin and capability-blocked routes send no group projection request.

V2 routes are `/groups` and `/groups/:groupId`. Applied prefix search, opaque
cursor, create-dialog state, and selected group are URL-addressable. Search is
submitted explicitly, resets the cursor, and uses `GET /group/search`; the
default page uses `GET /group/list`. Cursors are never decoded or constructed.

`groups_projection` gates all reads:

```text
GET  /group/list
GET  /group/search?q=&limit=&cursor=
POST /group/info
POST /group/invitelink       # reset:false projection/cache read
```

Projection not-started, syncing, ready, stale, and failed remain separate from
resource and transport state. Only a ready projection or a successful
capability-approved raw list establishes an authoritative empty result. Stale
rows remain visible with their refresh failure.

## Commands

The detail workspace owns the approved commands:

```text
POST /group/create
POST /group/name
POST /group/description
POST /group/settings
POST /group/participant
POST /group/invitelink       # reset:true mutation
POST /group/leave
POST /send/text
```

Metadata submits only changed fields. Because subject and description are two
backend commands, a failure after the first is presented as potentially
partial and is not automatically retried. Each setting submits one explicit
paired action. Member removal and leave require the exact member reference or
group JID. Invite reset requires confirmation because it revokes the old link.

Pending commands cannot be duplicated or dismissed. No mutation is optimistic
or automatically retried. A response means only server acknowledgement;
refreshed group projections remain authoritative for metadata, settings,
membership, and leave state. Group text additionally requires
`outbound_rate_limit`; acknowledgement never claims WhatsApp delivery and an
uncertain failure offers no one-click retry.

## Verification

- Exercise instance scope, blocked admin scope, capability discovery, and
  unsupported projection states; blocked states must send no group request.
- Exercise loading, ready, authoritative empty, syncing, stale, failed,
  normalized errors/request IDs, and rate-limit cooldowns.
- Verify prefix search, opaque cursor navigation, direct group links, browser
  back/forward, inspector/dialog focus, and exact typed confirmations.
- Verify every command prevents duplicate submission, refreshes only group
  query families, and uses acknowledgement-safe wording.
- Verify 360, 768, 1024, and 1440 CSS pixels without page-level overflow and
  confirm credentials never enter URL, storage, rendered DOM, or query keys.
