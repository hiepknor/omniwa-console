# UI v2 Conversations

This vertical slice replaces the complete Conversations journey when the exact
build-time UI generation is `v2`. Legacy Production remains unchanged until the
final cutover.

## Session and route model

Conversation APIs are instance-token scoped. V2 therefore requires an instance
credential and uses the authenticated session itself as the query scope; it
does not call `/instance/all`, ask for an instance ID, or infer identity from a
display name. Admin sessions render a blocking state and send no projection
request.

V2 routes are `/chats` and `/chats/:chatId`. Resource view, applied search,
opaque page cursor, message-page cursor, directory selection, and message
selection live in URL search params. Browser back/forward therefore restores
operator context without decoding or manufacturing cursors. Contact prefix
search is applied explicitly to avoid a server request on every keystroke;
chat and label filtering applies to the loaded page.

## Projection reads

Capabilities independently gate the following reads:

```text
chats_projection
  GET /chat/list
  GET /chat/info/{chatId}

messages_projection
  GET /chat/{chatId}/messages
  GET /message/{messageId}
  GET /message/{messageId}/delivery

contacts_projection
  GET /user/contacts
  GET /user/contacts/search?q=&limit=&cursor=
  GET /user/contact/{contactId}

labels_projection
  GET /label/list
  GET /label/info/{labelId}
```

No panel falls back to a live WhatsApp read. Projection not-started, syncing,
ready, stale, and failed remain independent from loading, refreshing, empty,
and transport state. Only a ready projection (or the capability-approved
legacy bare label array) establishes an authoritative empty collection. Stale
data remains visible with its refresh failure.

Message detail is checked against the selected chat before rendering. Delivery
receipts remain per-recipient projected facts. Unknown fields are displayed as
unreported rather than invented defaults, and label assignments are not
reconstructed because the public Chat/Message DTO does not expose them.

## Bounded sends

The composer is enabled only when both `messages_projection` and
`outbound_rate_limit` are advertised:

```text
POST /send/text
POST /send/media
```

Media input accepts only a remote HTTP(S) URL and explicit image, video, audio,
or document type. Binary and base64 media never enter browser state. Pending
commands cannot be duplicated. Sends have no automatic retry or optimistic
message insertion. A response is presented only as server acknowledgement;
projected message status and receipts remain authoritative for delivery. A
transport failure is uncertain and offers no one-click retry.

## Verification

- Exercise instance scope, blocked admin scope, capability discovery, and each
  independently unsupported projection; blocked paths must send no read.
- Exercise loading, authoritative empty, ready, syncing, stale, failed,
  normalized errors/request IDs, and rate-limit cooldowns.
- Verify opaque cursor navigation, applied search, direct chat links, selected
  message/directory inspectors, and browser back/forward.
- Verify duplicate-submit prevention, send acknowledgement wording, uncertain
  failure behavior, and narrow chat/message invalidation.
- Verify 360, 768, 1024, and 1440 CSS pixels without page-level overflow and
  confirm credentials never enter URL, storage, rendered DOM, or query keys.
