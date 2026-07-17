# Auth and Session

## Model

OmniWA authenticates public API clients with an API key sent as the
`x-api-key` header. Keys are provisioned outside this console (or via the
admin-only `admin-keys` panel) and come in kinds: API, admin, monitoring.

`omniwa-console` follows the self-hosted operator-tool pattern (Portainer /
Grafana style): the operator pastes an endpoint URL and key at runtime.
Nothing is baked into the build; there is no backend-for-frontend in v1.

## Connect screen (`/connect`)

Inputs:

- **API base URL** — in Vite development, defaults to the console origin so
  `/v1` requests use the local proxy to `http://localhost:3000` and avoid
  browser CORS preflight requirements. Production builds retain
  `http://localhost:3000` as the initial value. The submitted value is
  validated as an origin.
- **API key** — password-style input, never echoed after submit.

On submit the console probes `getHealth` with the provided credentials. On
success it stores the session and redirects to `/overview`; on failure it
shows the error envelope's category and message.

Key kind detection: the console attempts `listApiKeys` once after connect;
success marks the session as admin-scoped and reveals the `admin-keys`
panel. An authorization failure is expected for non-admin keys, marks the
session as api-scoped, and is not shown to the operator.

## Storage

Session shape, owned by `src/lib/session.ts`:

```ts
interface ConsoleSession {
  baseUrl: string;
  apiKey: string;
  keyKind: 'api' | 'admin' | 'unknown';
  connectedAt: string; // ISO timestamp
}
```

- Stored in `sessionStorage` only — cleared when the tab closes. A
  "remember on this device" checkbox opts into `localStorage`, with copy
  warning it stores the key on the device.
- The key is never logged, never placed in URLs, never shown in the UI
  after entry (a masked fingerprint like `omni…a1b2` may be displayed).
- "Disconnect" clears both storages and returns to `/connect`.

## Failure handling

| Failure | Behavior |
| --- | --- |
| `authentication` (401) on any call | Clear session, redirect to `/connect` with a "session invalid" notice |
| `authorization` (403) | Render inline; do not clear the session |
| Network unreachable | Banner with retry; keep session |

## Accepted risk

The API key is present in browser memory and (opt-in) local storage. This
is acceptable for an internal operator console on trusted machines. If the
console is ever exposed to untrusted networks or shared machines, add the
BFF variant (thin proxy holding the key server-side) as a deployment option
rather than changing this SPA contract.
