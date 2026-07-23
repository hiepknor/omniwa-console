# UI v2 Shell and Connect

This milestone adds the first route-level v2 journey without changing the API
contract, credential lifetime, or legacy Production default.

## Generation boundary

`VITE_CONSOLE_UI_GENERATION=v2` selects the v2 Shell and Connect at build time.
Every missing, misspelled, or differently cased value resolves to `legacy`.
This is a presentation switch only: both generations share the same session,
API client, capability provider, realtime provider, query client, route modules,
and memory-only credential flow.

Build separate immutable artifacts for Staging review and Production rollback:

```bash
VITE_CONSOLE_UI_GENERATION=v2 pnpm build
```

Do not enable v2 in Production before the cutover gates in
[REDESIGN_BRIEF.md](REDESIGN_BRIEF.md) pass. Rolling back means redeploying the
reviewed legacy-generation artifact; it never means persisting a credential.

## Connect behavior

Both generations call the same audited flow in `src/app/ConnectPage.tsx`:

1. Normalize an HTTP(S) origin with no path, query, fragment, or user info.
2. Probe `GET /instance/all` for an admin credential.
3. After an authorization rejection, probe `GET /instance/status` for an
   instance credential.
4. Create an in-memory session or show the normalized failure and request ID.

The submit guard prevents duplicate probes and the request is aborted after 15
seconds. The key has password autocomplete disabled and is never written to
browser storage, a URL, a query key, logs, analytics, or diagnostics. Reload and
sign-out destroy it.

## Shell behavior

The shell exposes environment, credential scope, capability-discovery status,
backend version/revision, and the in-memory credential posture. It never
renders credential-derived characters. Navigation is derived from the detected
credential kind:

| Scope | Visible v2 navigation |
| --- | --- |
| Admin | Overview, Recovery when supported, Instances |
| Instance | Overview, Conversations, Groups, Campaigns, Events |
| Unknown | Overview |

Queue, webhook administration, global settings, and API-key management are not
advertised because the current public contract does not support those Console
workflows. Recovery appears only with admin scope, its complete route, and the
`projection_failure_operations` capability; it is never an empty placeholder.

Build-time aliases now select a complete route manifest and CSS entrypoint
before bundling. The v2 artifact contains no legacy panels or compatibility
CSS; the independently built legacy artifact preserves reviewed rollback
journeys until post-Production deletion.

## Review checklist

- Confirm the exact environment and scope remain visible at 360, 768, 1024,
  and 1440 CSS pixels.
- Confirm no page-level horizontal overflow and that the mobile secret toggle
  remains a labelled pill, not a circular icon.
- Confirm keyboard order, visible focus, skip-link behavior, direct links, and
  sign-out access.
- Exercise admin, instance, invalid, unreachable, timeout, and request-ID error
  states against representative runtimes.
- Inspect local storage, session storage, URL, network diagnostics, logs, and
  rendered failure content for credential leakage.
