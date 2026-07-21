# Auth and Session

## Model

The console talks to the **OmniWA GO** API, which authenticates every request
with an `apikey` HTTP header (see `../omniwa-go/docs/wiki-en/authentication.md`).
There is no login, cookie, or JWT flow. There are two key tiers:

| Tier | Header value | Grants | `keyKind` |
| --- | --- | --- | --- |
| **Global admin key** | value of `GLOBAL_API_KEY` | Instance lifecycle (`/instance/create·all·info·delete·…`) and the `/ws` socket | `admin` |
| **Instance token** | `token` returned by `POST /instance/create` | Everything scoped to one WhatsApp account (`/send/*`, `/message/*`, `/group/*`, `/user/*`, `/label/*`, …) | `api` |

`omniwa-console` follows the self-hosted operator-tool pattern (Portainer /
Grafana style): the operator pastes an endpoint URL and key at runtime. Nothing
is baked into the build; there is no backend-for-frontend.

## Connect screen (`/connect`)

Inputs:

- **API base URL** — defaults to the omniwa-go dev origin
  `http://localhost:8080` (`DEFAULT_BASE_URL` in `src/api/client.ts`). The
  submitted value is validated as an origin.
- **API key** — password-style input, never echoed after submit.

On submit the console **probes and classifies** the key (`probeKey` in
`ConnectPage.tsx`): it calls `GET /instance/all`; success means the global admin
key (`admin`). A `401/403` there falls back to `GET /instance/status`; success
means a per-instance token (`api`). A `401` on both means the key is invalid and
the error category/message is shown. On success the session is stored and the
console redirects to `/overview`.

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

- Stored in `sessionStorage` only — cleared when the tab closes. A "remember on
  this device" checkbox opts into `localStorage`, with copy warning it stores
  the key on the device.
- The key is never logged, never placed in URLs, never shown in the UI after
  entry (a masked fingerprint like `dev-…-me` may be displayed).
- "Disconnect" clears both storages and returns to `/connect`.

## Failure handling

| Failure | Behavior |
| --- | --- |
| `authentication` (401) on any call | Clear session, redirect to `/connect` with a "session invalid" notice |
| `authorization` (403) | Render inline; do not clear the session |
| Network unreachable | Banner with retry; keep session |

## Accepted risk

The apikey is present in browser memory and (opt-in) local storage. A
per-instance token exposed this way can send as that one account — comparable to
the previous `x-api-key` posture. The **global admin key is far more powerful**
(it can create/delete every instance); pasting it into the console grants full
admin to whoever uses that browser, so only do so on a trusted machine.

The omniwa-go realtime socket `/ws` requires the global key and therefore is
**not** opened from the browser (see `docs/REALTIME.md`); a BFF/proxy would be
required to add live streaming safely.
