# Contract decision register

This register groups every public operation that is intentionally outside the
approved v2 Console panels. It complements the complete per-operation inventory
in [CONTRACT_UI_MATRIX.md](CONTRACT_UI_MATRIX.md) and the implemented ownership
map in [PANELS.md](PANELS.md).

Run `pnpm contract:ui:backlog` to print the generated decision-unit tables and
operation membership after editing `scripts/contract-ui-policy.mjs`.

An owner below is an accountable role, not a named approver or an assertion
that work has been scheduled. Product-deferred operations require an approved
end-to-end operator workflow. Backend-risk operations require backend evidence
before Product can consider a Console workflow. External-client operations are
not Console backlog.

## Decision units

| Decision unit | Classification | Accountable role | Status | Operations |
| --- | --- | --- | --- | ---: |
| `product-call-control` | deferred-product-workflow | Product | `awaiting-workflow-approval` | 1 |
| `product-contacts-and-labels` | deferred-product-workflow | Product | `awaiting-workflow-approval` | 16 |
| `product-conversations` | deferred-product-workflow | Product | `awaiting-workflow-approval` | 20 |
| `product-groups-and-communities` | deferred-product-workflow | Product | `awaiting-workflow-approval` | 5 |
| `product-instance-fleet` | deferred-product-workflow | Product | `awaiting-workflow-approval` | 7 |
| `product-newsletters` | deferred-product-workflow | Product | `awaiting-workflow-approval` | 6 |
| `backend-chat-state-commands` | deferred-backend-risk | Backend | `blocked-backend-verification` | 6 |
| `backend-live-group-list` | deferred-backend-risk | Backend | `blocked-backend-verification` | 1 |
| `external-passkey-helper` | external-client | External client | `out-of-console-scope` | 3 |

## Operation membership and exit criteria

### `product-call-control`

Exit: Approve an operator call-control journey, scope, safety behavior, and navigation placement.

- `POST /call/reject`

### `product-contacts-and-labels`

Exit: Approve coherent privacy, profile, blocklist, and label-management journeys with mutation safety requirements.

- `GET /user/blocklist`
- `GET /user/privacy`
- `POST /label/chat`
- `POST /label/edit`
- `POST /label/message`
- `POST /unlabel/chat`
- `POST /unlabel/message`
- `POST /user/avatar`
- `POST /user/block`
- `POST /user/check`
- `POST /user/info`
- `POST /user/privacy`
- `POST /user/profileName`
- `POST /user/profilePicture`
- `POST /user/profileStatus`
- `POST /user/unblock`

### `product-conversations`

Exit: Approve bounded message actions, rich outbound types, history sync, polls, and delivery semantics as complete operator workflows.

- `GET /polls/{pollMessageId}/results`
- `POST /chat/history-sync`
- `POST /message/delete`
- `POST /message/downloadmedia`
- `POST /message/edit`
- `POST /message/markplayed`
- `POST /message/markread`
- `POST /message/presence`
- `POST /message/react`
- `POST /message/status`
- `POST /send/button`
- `POST /send/carousel`
- `POST /send/contact`
- `POST /send/link`
- `POST /send/list`
- `POST /send/location`
- `POST /send/poll`
- `POST /send/status/media`
- `POST /send/status/text`
- `POST /send/sticker`

### `product-groups-and-communities`

Exit: Approve community, group-join, and group-photo journeys including confirmation, acknowledgement, and refresh behavior.

- `POST /community/add`
- `POST /community/create`
- `POST /community/remove`
- `POST /group/join`
- `POST /group/photo`

### `product-instance-fleet`

Exit: Approve any remaining admin fleet journey without restoring credential-bearing legacy reads or bypassing metadata views.

- `DELETE /instance/proxy/{instanceId}`
- `GET /instance/all`
- `GET /instance/info/{instanceId}`
- `GET /instance/logs/{instanceId}`
- `POST /instance/forcereconnect/{instanceId}`
- `POST /instance/pair`
- `POST /instance/proxy/{instanceId}`

### `product-newsletters`

Exit: Approve newsletter discovery, creation, membership, and message inspection as one operator workflow.

- `GET /newsletter/list`
- `POST /newsletter/create`
- `POST /newsletter/info`
- `POST /newsletter/link`
- `POST /newsletter/messages`
- `POST /newsletter/subscribe`

### `backend-chat-state-commands`

Exit: Document and verify idempotency, acknowledgement, projection write-through, and machine-readable failures for chat-state commands.

- `POST /chat/archive`
- `POST /chat/mute`
- `POST /chat/pin`
- `POST /chat/unarchive`
- `POST /chat/unmute`
- `POST /chat/unpin`

### `backend-live-group-list`

Exit: Provide a supported projection-backed use case or explicitly approve the live-read reliability and readiness semantics.

- `GET /group/myall`

### `external-passkey-helper`

Exit: Remain in the passkey helper; any Console ownership change requires a separately approved product and security decision.

- `GET /passkey-ceremony/{token}`
- `POST /passkey-ceremony/{token}/confirm`
- `POST /passkey-ceremony/{token}/response`

## Change protocol

Changing a decision unit is a product/contract decision, not a navigation-only
change. The same PR must update the policy classification, this register, and
`PANELS.md`; assign every newly approved operation to exactly one panel; and
state capability, credential scope, server acknowledgement, error, cursor,
projection, and mutation-retry semantics. Backend-risk work also needs linked
backend verification evidence. Named approvals belong in release evidence, not
in this source-controlled role register.
