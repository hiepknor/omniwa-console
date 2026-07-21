# Handoff — pointing omniwa-console at the omniwa-go public API

**Author:** carried over from work on `../omniwa-go` (its public API was just
documented and hardened). **Goal of this doc:** give whoever develops the
console the full, honest picture of what it takes to make `omniwa-console`
talk to **omniwa-go** instead of (or alongside) the **omniwa Platform**.

> Read this before touching `src/api/`. The short version: omniwa-go is a
> different, smaller backend with a different contract shape. This is a
> re-architecture of the API layer, not a `baseUrl` swap.

---

## 0. TL;DR

- The console is built against the **omniwa Platform v1** contract
  (`contracts/omniwa-v1.openapi.json`, OpenAPI 3.1, `/v1/*`, cursor
  pagination, resource-typed envelopes, `error.category`/`requestId`, async
  `202` commands, SSE `streamEvents`, header `x-api-key`).
- **omniwa-go** exposes a much smaller, differently-shaped API: Swagger **2.0**,
  flat routes (`/instance`, `/send`, `/message`, …), envelope `{message,data}`
  / `{error:"string"}`, header **`apikey`**, realtime over a **WebSocket**
  `/ws` emitting `{queue,payload}` frames. No metrics, queue, webhooks-mgmt,
  api-keys-mgmt, settings, dashboard, media, audit, or cursor pagination.
- Therefore only a **subset** of the console (instances, groups, contacts,
  labels, compose/send, a realtime ticker) can be backed by omniwa-go, and
  even that needs new envelope/error/realtime adapters. The metrics/queue/
  webhooks/api-keys/settings/action-required panels have **no omniwa-go
  backing** and would need a new backend or must be hidden.
- Recommended path: put a thin **adapter (BFF)** in front of omniwa-go that
  speaks the v1 envelope the console already expects, rather than rewriting
  the console's contract-driven `src/api/` and breaking its `*:check` guards.
  Alternatives below.

---

## 1. omniwa-go API — quick reference

Full reference lives in the omniwa-go repo:

- **Swagger UI:** `http://localhost:4000/swagger/index.html` (dev stack) —
  auto-generated, always in sync, has an **Authorize** button.
- **Machine spec:** `http://localhost:4000/swagger/doc.json` (**Swagger 2.0**).
- **Guides:** `../omniwa-go/docs/wiki-en/` — `getting-started.md`,
  `authentication.md`, `conventions.md`, `websocket-events.md`.

### Auth (two tiers, header `apikey`)

| Tier | Header | Scope |
|---|---|---|
| Global admin key (`GLOBAL_API_KEY`) | `apikey: <global>` | `/instance/create·all·info·delete·proxy·forcereconnect·logs`, and the `/ws` WebSocket |
| Per-instance token | `apikey: <instance token>` | everything else: `/instance/connect·qr·status`, `/send/*`, `/message/*`, `/chat/*`, `/group/*`, `/user/*`, `/community/*`, `/newsletter/*`, `/label/*`, `/call/*`, `/polls/*` |

Note: header name is **`apikey`**, not `x-api-key`. Dev stack global key:
`dev-global-api-key-change-me`.

### Response shape

```json
// success (data present only when there is a payload)
{ "message": "success", "data": { /* endpoint-specific */ } }
// error
{ "error": "phone number is required" }
```
A few endpoints return the payload **directly** (no envelope): `/instance/logs`,
`/label/list`, `/polls/{id}/results`, advanced-settings. Every apikey endpoint
now carries a typed OpenAPI schema (see the omniwa-go PRs #12/#13).

### Endpoint groups (no `/v1` prefix, no cursor pagination)

`instance` · `send` · `message` · `chat` · `group` · `user` · `community` ·
`newsletter` · `label` · `call` · `polls`. Health: `GET /server/ok`.

### Realtime — WebSocket `/ws`

```js
new WebSocket("ws://localhost:4000/ws?instanceId=<id>", ["apikey", GLOBAL_API_KEY]);
// frames: { "queue": "<lowercased event>", "payload": "<JSON string>" }
```
Event types: `message, send_message, read_receipt, presence, history_sync,
chat_presence, call, connection, label, contact, group, newsletter, qrcode,
button_click, picture, user_about`. Auth uses the **global** key via
`Sec-WebSocket-Protocol`. No cursor/backfill/replay — reconnect + resync via
REST.

---

## 2. The contract gap (this is the real work)

| Concern | Console expects (omniwa Platform v1) | omniwa-go provides |
|---|---|---|
| Auth header | `x-api-key` | `apikey` |
| Base path | `/v1/*`, operationIds (`listInstances`…) | `/instance`, `/send`, … (no version, swaggo operationIds) |
| Spec format | OpenAPI **3.1** (openapi-typescript input) | Swagger **2.0** (needs `swagger2openapi` conversion) |
| Success read | resource envelope `{ data, meta.pagination.cursor }`, `pickResource(type)` | `{ message, data }`, no `type`, no pagination |
| Errors | `{ error: { category, message, requestId, meta } }` + 8 categories | `{ error: "<string>" }`, category only via HTTP status |
| Commands | sync **or** async `202 accepted`, idempotency keys, `OperationData` | synchronous only, no idempotency, no operation id |
| Realtime | **SSE** `streamEvents`, cursor-resumable, backfill/gap detection | **WebSocket** `/ws`, `{queue,payload}`, no cursor |
| Pagination | `cursor` + `limit` everywhere | none (bulk lists, e.g. `/instance/all`, `/group/list`) |
| Resource IDs | typed resources (`InstanceResource`, `ChatResource`…) | raw domain objects (whatsmeow-shaped) |

### Whole panels with **no** omniwa-go backend

`overview` (dashboard/metrics/action-required), `queue` (jobs), `webhooks`
(management + deliveries), `api-keys` (provisioning/rotation), `settings`,
media resources, audit/events history. These would need a new backend
(adapter or omniwa-go extension) or must be feature-flagged off.

---

## 3. Capability map — console panel → omniwa-go

| Console panel | omniwa-go support | Notes |
|---|---|---|
| **instances** | ✅ mostly | `create`→`POST /instance/create`; `list`→`GET /instance/all`; `get`→`/instance/info/{id}`; `connect`→`/instance/connect`; `qr`→`GET /instance/qr` (poll); `status`→`/instance/status`; `disconnect`/`reconnect`/`logout`/`delete`. No `sessions`, no `providerCapabilities`. |
| **chats** (PRIMARY) | ⚠️ partial/weak | omniwa-go has **no list-chats / list-messages / message-history** endpoints. Only realtime `message` events (`/ws`) + `history-sync` trigger. Chat pin/mute/archive exist but are marked `// TODO: not working` in omniwa-go routes. Contacts via `/user/contacts`; labels via `/label/list`. Building the chats workspace requires client-side message accumulation from `/ws`. |
| **groups** | ✅ mostly | `/group/list`, `/group/info`, `create`, `participant`, `name`, `description`, `photo`, `invitelink`, `leave`, `settings`. No cursor pagination. |
| **compose / send** | ✅ | `/send/text·link·media·location·contact·sticker·poll·button·list·carousel·status`. |
| **events** (ticker) | ⚠️ different transport | Map to `/ws` frames instead of SSE `streamEvents`; no cursor replay/audit history. |
| **overview** | ❌ | No metrics/dashboard/action-required. Only `GET /server/ok`. |
| **queue** | ❌ | No queue/jobs concept exposed. |
| **webhooks** | ❌ (config-only) | Webhook is set **per instance** (`webhookUrl` on create/connect); no CRUD/delivery-history API. |
| **api-keys** | ❌ | Keys are static env (`GLOBAL_API_KEY`) + per-instance tokens; no provisioning API. |
| **settings** | ❌ | Only per-instance `advanced-settings` (AlwaysOnline, RejectCall, ReadMessages, IgnoreGroups, IgnoreStatus). |

---

## 4. Recommended approach

**Option A — Adapter / BFF in front of omniwa-go (recommended).**
Stand up a small service that implements the omniwa Platform v1 contract
surface the console needs, backed by omniwa-go: translate `x-api-key`→`apikey`,
`/v1/instances`→`/instance/*`, wrap `{message,data}`→resource envelopes with a
synthesized `meta.requestId`, map errors to `{category,message,requestId}`, and
bridge `/ws` frames → SSE `streamEvents` with a synthetic cursor. Panels with
no backing return `not_implemented` (the console already renders
`UnavailableRead`/`not_implemented` cleanly). **Pros:** console stays
unchanged, its `*:check` guards and contract-driven design keep working.
**Cons:** you build/maintain a backend.

**Option B — Fork the console's `src/api/` to speak omniwa-go natively.**
New `client.ts` (header `apikey`, base `:4000`), new `envelopes.ts`
(`{message,data}` / string errors), new realtime over `/ws`, drop the
unsupported resource modules, and hide unsupported panels. **Pros:** no new
backend. **Cons:** breaks the contract-driven architecture, `contract:check`
/ `architecture:check` / `api:generate` (needs a 3.x spec) no longer apply,
and you diverge hard from the Platform track — two consoles to maintain.

**Option C — Extend omniwa-go to add the missing v1 surface.** Largest
backend effort; only worth it if omniwa-go is meant to become the platform.

**Guidance:** if the intent is "run the console against omniwa-go for real",
do **Option A**. If it's a throwaway/experiment, a branch doing **Option B**
for just `instances` + `send` + a `/ws` ticker is the smallest spike.

---

## 5. If you go Option B — concrete first steps

1. **Spec:** `npx swagger2openapi ../omniwa-go/docs/swagger.json -o contracts/omniwa-go.openapi.json`, then point `api:generate` at it (it produces `src/api/generated/schema.d.ts`). Expect ~500 whatsmeow schema defs (noise, harmless).
2. **Client:** in `src/api/client.ts`, change the auth header to `apikey` and default `baseUrl` to the omniwa-go origin (`:4000`/`:8080`).
3. **Envelopes:** replace `src/api/envelopes.ts` — success is `{message,data}` (no `meta`/cursor), error is `{error:string}` (synthesize a `category` from HTTP status; there is no `requestId`). `CommandResult` is always `completed` (no `202`).
4. **Resource modules:** rewrite `instances.ts` against `/instance/*`; add `send.ts` for `/send/*`; rewrite `groups.ts` against `/group/*`. Delete/stub `queue.ts`, `webhooks.ts`, `api-keys.ts`, `settings.ts`, `overview.ts` (or have them throw `not_implemented`).
5. **Realtime:** replace SSE `events.ts` with a `/ws` client (`Sec-WebSocket-Protocol: ["apikey", GLOBAL_KEY]`, `?instanceId=`); map `queue` → the query-invalidation keys in `keys.ts`.
6. **Session:** the console already models `keyKind: api|admin` — reuse it for omniwa-go's per-instance vs global key split (`AUTH_AND_SESSION.md`).
7. **Panels:** trim the sidebar/routes to the supported set; unsupported panels stay behind a flag. Update `docs/PANELS.md` in the same change (AGENTS.md rule).

---

## 6. Console constraints any work must respect (from `AGENTS.md`)

- Never edit `src/api/generated/` by hand — regenerate via `pnpm api:generate`.
- All network access goes through `src/api/`; no `fetch` in features/components.
- A panel may only call the operation IDs listed for it in `docs/PANELS.md`;
  update that file in the same change if the mapping changes.
- Features never import other features.
- `pnpm check` (design + contract + architecture + typecheck + build + bundle)
  must pass offline. **Note:** Option B will break `contract:check` /
  `api:generate` assumptions (they expect the Platform 3.1 spec) — expect to
  update those guard scripts too.
- Sandbox has no network: don't `pnpm install`; request new deps
  (`swagger2openapi`) from the orchestrator.

---

## 7. Decisions (resolved 2026-07-21)

1. **Option B — native fork.** The console's `src/api/` speaks omniwa-go
   directly; the omniwa Platform contract is dropped entirely.
2. **Scope:** all panels are kept in the shell; only instances, groups, send,
   contacts, labels, and message actions have an omniwa-go backend. Panels with
   no backing render `not_implemented`.
3. **One backend.** Platform support is removed (no runtime selection).
4. **Chats: deferred.** With realtime disabled and no list/history REST, chats
   is stubbed until omniwa-go grows those endpoints (or a `/ws` BFF is added).
5. **Realtime: off.** `/ws` needs the global admin key and is unsafe from the
   browser; panels poll instead (`docs/REALTIME.md`).

### Migration progress

- **Done:** spec sync + type generation (`contracts/omniwa-go.openapi.json`),
  `apikey` client, `{message,data}` envelopes + status-derived error categories,
  all `src/api/` modules converted (unsupported → `notImplemented` stubs),
  realtime replaced with a polling stub, `contract:check`/`architecture:check`
  repointed, mock workspace removed, docs + tests updated. All gates green.
- **Next:** wire the instances and groups feature verticals to live
  `/instance/*` and `/group/*` endpoints (adapting the UI to omniwa-go's
  whatsmeow-shaped fields), and add a `send` module for `/send/*`.

---

## 8. References

- omniwa-go API guides: `../omniwa-go/docs/wiki-en/` (auth, getting-started,
  conventions, websocket-events).
- omniwa-go spec: `../omniwa-go/docs/swagger.json` (Swagger 2.0).
- omniwa-go dev stack: `docker compose -f ../omniwa-go/docker/docker-compose.dev.yml up -d`
  → `http://localhost:4000/swagger/index.html` (project `omniwa-dev`).
- Console contract + rules: `contracts/omniwa-v1.openapi.json`, `AGENTS.md`,
  `docs/API_CLIENT.md`, `docs/AUTH_AND_SESSION.md`, `docs/REALTIME.md`,
  `docs/PANELS.md`.
