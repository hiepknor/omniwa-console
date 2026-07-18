# Chats Panel — Platform Contract Gaps

Status: **proposal**. This document records public-contract limits found while
implementing the M3 Chats panel. The console renders only public projections
and does not reconstruct provider-native identifiers or message content.

## 1. Message projections contain no message content

**What the contract provides:** `MessageResource` exposes message identity,
instance and conversation references, status, type, direction, and lifecycle
timestamps. It has no text, body, caption, or display-safe media summary.

**What the console needs:** A message timeline needs display-safe text and
caption content, plus enough media metadata to identify the attachment without
exposing provider payloads.

**How the console degrades today:** Bubbles render typed placeholders with the
message ID. The console does not infer content from delivery data or provider
references.

**Proposed platform change:** Add an explicitly display-safe content projection
to `MessageResource`, modelled as typed text and media variants with caption and
sanitized media metadata.

## 2. Instance message reads cannot filter by chat

**What the contract provides:** `listInstanceMessages` supports cursor, limit,
and sort parameters, but it has no `chatId` filter.

**What the console needs:** A conversation timeline needs cursor pagination
scoped to one chat so operators can reach deep history without reading unrelated
instance traffic.

**How the console degrades today:** The console filters each fetched instance
message page client-side by `chatId`. Reaching deep history for one conversation
requires paging the whole instance message stream.

**Proposed platform change:** Add a documented `chatId` filter to
`listInstanceMessages`, preserving opaque cursor semantics within that filtered
result set.

## 3. Instance chat reads cannot search or filter by label

**What the contract provides:** `listInstanceChats` supports cursor and limit
only. It has no search text or label filter parameters.

**What the console needs:** Conversation search and label filtering should apply
to the full instance chat collection, not only the pages already present in the
browser.

**How the console degrades today:** Search and label filtering run client-side
over loaded chat pages. A matching conversation on an unloaded page does not
appear until that page is fetched.

**Proposed platform change:** Add normalized `search` and repeatable `labelId`
filters to `listInstanceChats`, and reflect accepted values in collection
metadata.

## 4. Chat projections have no contact linkage

**What the contract provides:** `ChatResource` exposes an ID and optional display
name, while `ContactResource` has its own ID and display name. Neither projection
contains a public reference linking the two.

**What the console needs:** The contact card needs an authoritative contact ID
for the selected direct chat.

**How the console degrades today:** The console resolves loaded contacts by exact
display-name equality as a best effort. If there is no match, the Contact value
renders as `—`; duplicate names may remain ambiguous.

**Proposed platform change:** Add an optional public `contactId` to direct-chat
projections, or expose a typed chat-contact relationship resource.

## 5. Delivery history has no documented projection shape

**What the contract provides:** `getMessageDeliveryHistory` returns generic
`PublicData`; the contract does not define a delivery step collection, status,
timestamp, attempt, reason, or retryability fields for this operation.

**What the console needs:** The selected-message pane needs an ordered, typed
delivery timeline with display-safe status, timestamp, detail, and retryability.

**How the console degrades today:** The console defensively inspects known
array-field names and renders only step-like objects. Other shapes receive a calm
fallback with the response request ID instead of guessed delivery history.

**Proposed platform change:** Define a `MessageDeliveryHistoryResource` with an
ordered array of typed delivery steps and bind it directly to the operation's
success envelope.

## 6. Text recipient references have no documented chat mapping

**What the contract provides:** `TextMessageRequest.to` is described only as an
opaque recipient reference. The contract does not state whether a public chat ID
is a valid value or provide another display-safe recipient reference on
`ChatResource`.

**What the console needs:** Sending from a selected conversation requires a
documented mapping from that chat to the recipient reference accepted by text
and media send operations.

**How the console degrades today:** The console sends the selected chat ID as
`to`. This assumption must be verified against a connected runtime and failures
surface through the standard product-safe error envelope.

**Proposed platform change:** Document chat IDs as valid recipient references,
or add a dedicated opaque `recipientRef` to the chat projection and use it
consistently across send requests.
