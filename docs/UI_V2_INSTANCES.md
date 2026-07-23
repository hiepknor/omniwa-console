# UI v2 Instances

This vertical slice replaces the complete `/instances` and
`/instances/:instanceId` journey when the exact build-time UI generation is
`v2`. Legacy Production remains unchanged until the final cutover.

## Fleet boundary

The list and detail are admin-scoped, capability-gated control-plane reads:

```text
GET /instance/metadata
GET /instance/metadata/{instanceId}
GET /instance/credential-health
```

V2 requires `instance_metadata_views` before enabling either metadata query.
It never falls back to `/instance/all` or `/instance/info/{instanceId}`. Those
legacy responses can contain credential-bearing fields and are explicitly
deferred by the contract/UI matrix. Credential Health additionally requires
`instance_credential_health`; it displays C3 facts, treats zero instances as a
non-representative 0/0 baseline, and never derives `safeToRemove`.

Search, status, create-dialog state, and selected instance are URL-backed.
Filters apply to the already loaded metadata page and do not issue a request on
every keystroke. List/detail polling is bounded to the open route. Initial,
empty, ready, stale-refresh failure, rate-limit, unsupported, and wrong-scope
states remain distinct.

## Credential and live-state boundary

Admin metadata never supplies an instance token. The operator attaches a token
inside the selected instance workspace, or receives it from create/rotation.
Tokens live only in the `ApiProvider` in-memory vault: never in a query key,
URL, browser storage, analytics, logs, or metadata view model. Replacing or
forgetting a token removes token-scoped cached status, QR, and settings.

The token-scoped operations are:

```text
GET    /instance/status
GET    /instance/qr
POST   /instance/connect
POST   /instance/disconnect
POST   /instance/reconnect
DELETE /instance/logout
GET    /instance/{instanceId}/advanced-settings
PUT    /instance/{instanceId}/advanced-settings
```

Metadata connection, live connection, and pairing are separate facts. Console
does not infer live state before `/instance/status` returns. QR is requested
only after live status reports connected and not logged in; pairing completes
only when refreshed status reports `loggedIn`.

## Commands and one-time secrets

Admin commands are:

```text
POST   /instance/create
POST   /instance/rotate-token/{instanceId}
DELETE /instance/delete/{instanceId}
```

Create and rotate show the returned token once and require an explicit “stored”
acknowledgement before the dialog closes. Rotation requires the current version
and an operator reason. Disconnect, logout, and destroy require the exact
instance ID. Pending commands cannot be duplicated or dismissed. No mutation
is optimistic or automatically retried. Success means only that the server
acknowledged the command; refreshed reads remain authoritative for connectivity,
pairing, settings, and deletion.

## Verification

- Exercise admin, instance-key, capability discovery, and unsupported states;
  blocked states must send no fleet request.
- Exercise loading, empty, filtered-empty, ready, stale refresh failure,
  normalized error/request ID, and rate-limit states.
- Verify direct detail links, URL filters, browser back/forward, inspector and
  dialog focus, typed confirmations, and duplicate-submission prevention.
- Verify create/rotation token lifecycle and empty browser storage after reload
  and sign-out.
- Verify 360, 768, 1024, and 1440 CSS pixels without page-level overflow.
