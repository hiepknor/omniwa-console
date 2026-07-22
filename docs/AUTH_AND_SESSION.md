# Authentication and Session

## Credential model

OmniWA GO authenticates requests with an `apikey` header. There is no login,
cookie, refresh token, or JWT flow.

| Credential | Scope | Console use |
| --- | --- | --- |
| Global admin key | Server-wide and instance lifecycle operations | Active session client for instance administration, server capabilities, overview, and health |
| Instance token | One WhatsApp account | Scoped client for groups, contacts, labels, chats, messages, sends, and other instance resources |

Route middleware and the OpenAPI contract remain authoritative for exact scope.
The console does not broaden a token by proxying through the admin client.

## Connect screen

`/connect` accepts:

- API origin, default `http://localhost:4000`;
- API key, entered as a password value;
- optional persistence on the current device.

`ConnectPage` classifies the key without exposing it:

1. call `GET /instance/all`;
2. success means admin scope;
3. a 401/403 falls back to `GET /instance/status`;
4. success there means instance-token scope;
5. failure renders the normalized API error.

After connection, the shell calls `GET /server/capabilities`. Projection panels
repeat capability negotiation with their selected instance token.

## Session storage

```ts
interface ConsoleSession {
  baseUrl: string;
  apiKey: string;
  keyKind: 'api' | 'admin' | 'unknown';
  connectedAt: string;
}
```

- Default storage is `sessionStorage` and ends with the tab session.
- “Remember on this device” opts into `localStorage` with an explicit warning.
- Connecting clears any older session before saving the new one.
- Disconnect and authentication failure clear both storage locations and the
  TanStack Query cache.
- The UI may show a masked fingerprint; it never renders the complete key.

## Secret-handling rules

- Never put the global key or instance token in a URL, query key, log, error,
  analytics event, screenshot fixture, or committed file.
- Query caches are scoped by stable instance ID, never by credential value.
- API clients hold keys only in runtime memory and configured browser storage.
- Instance-token rotation must refresh the scoped client without persisting the
  old token elsewhere.
- The SPA does not open `/ws`, because doing so would expose the global admin
  key to browser code. See `docs/REALTIME.md`.

## Failure handling

| Failure | Behavior |
| --- | --- |
| 401 authentication | Clear session/cache and return to `/connect` with a session-invalid notice |
| 403 authorization | Render in place; keep the session so other permitted panels remain usable |
| Browser transport failure | Keep the session and show one workspace condition |
| Instance token absent | Do not issue scoped calls; render an explicit scope/not-ready state |

## Accepted risk

Any browser credential is accessible to code running in that origin. A global
admin key can administer every instance and is substantially more powerful than
an instance token. Operators should use the least-privileged token that supports
their workflow, a trusted machine, and a trusted console origin. A future BFF
could replace browser-held admin credentials, but this repository remains a
client-only SPA.
