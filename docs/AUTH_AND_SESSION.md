# Authentication and Session

## Credential model

OmniWA GO authenticates requests with an `apikey` header. There is no login,
cookie, refresh token, or JWT flow.

| Credential | Scope | Console use |
| --- | --- | --- |
| Global admin key | Server-wide and instance lifecycle operations | Active session client for instance administration, server capabilities, overview, and health |
| Instance token | One WhatsApp account | Scoped client for groups, contacts, labels, chats, messages, sends, and other instance resources |

Route middleware and the OpenAPI contract remain authoritative for exact scope.
The Console does not broaden a token by proxying through the admin client.

## Connect screen

`/connect` accepts:

- HTTP(S) API origin, default `http://localhost:4000`;
- API key, trimmed after paste and entered as a password value with
  autocomplete, autocorrect, capitalization, and spellcheck disabled.

`ConnectPage` classifies the key without exposing it:

1. call `GET /instance/all`;
2. success means admin scope;
3. a 401/403 falls back to `GET /instance/status`;
4. success there means instance-token scope;
5. failure renders the normalized API error.

The probe has a 15-second timeout. Origin and credential fields are locked
while it is active so the visible values cannot diverge from the in-flight
request. Local development connects directly to the OmniWA GO API origin; the
Console origin is not an API proxy for these root-level operations.

After connection, the shell calls `GET /server/capabilities`. Projection panels
repeat capability negotiation with their selected instance token.

## Session lifetime

```ts
interface ConsoleSession {
  baseUrl: string;
  apiKey: string;
  keyKind: 'api' | 'admin' | 'unknown';
  connectedAt: string;
}
```

- The active admin key or instance token is held in React memory only.
- Reload, sign-out, and authentication failure discard the active session and
  clear the TanStack Query cache.
- Application startup removes credentials left in `sessionStorage` or
  `localStorage` by older Console builds; current builds never write them.
- The UI may show a masked fingerprint; it never renders the complete key.

## Secret-handling rules

- Never put the global key or instance token in a URL, query key, log, error,
  analytics event, screenshot fixture, or committed file.
- Query caches are scoped by stable instance ID, never by credential value.
- Login and one-time instance credentials use runtime memory only.
- Ordinary instance list/detail resources never contain bearer tokens, even
  when the old-backend fallback response includes them.
- Instance-token rotation must refresh the scoped client without persisting the
  old token elsewhere.
- An admin may attach an existing instance token to the in-memory vault after a
  reload. The value is cleared on reload, sign-out, or explicit forget; it is
  never added to instance resources or query caches.
- The Console does not open `/ws`, because doing so would expose the global admin
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
their workflow, a trusted machine, and a trusted Console origin. A future BFF
could replace browser-held admin credentials, but this repository remains a
client-only SPA.
