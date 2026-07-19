# M6 Groups and Settings — Platform Contract Gaps

Status: **proposal**. This document records public-contract limits found while
implementing the M6 Groups, Settings, and admin API-key surfaces. The console
stays within the public projections and does not infer data the platform does
not expose.

## 1. API-key inventory omits fingerprint and last-used time

**What the contract provides:** `ApiKeyResource` exposes a safe key ID, kind,
scopes, allowed instance references, lifecycle status, rotation attribution,
and lifecycle timestamps. It exposes neither a masked fingerprint nor a
last-used timestamp.

**What the console needs:** The API-key inventory prototype includes
Fingerprint and Last-used columns so operators can distinguish credentials and
identify stale keys.

**How the console degrades today:** The shipped inventory omits both columns.
It never derives a fingerprint from the current session secret or presents an
activity time that is not in the resource projection.

**Proposed platform change:** Add a platform-generated, display-safe
fingerprint and an optional last-used timestamp to `ApiKeyResource`.

## 2. Refreshed group invite links are not readable

**What the contract provides:** `refreshGroupInviteLink` returns only an
accepted operation envelope. It does not return invite-link material, and no
read projection exposes that material afterward.

**What the console needs:** Operators need to display and copy the refreshed
invite link after requesting a refresh.

**How the console degrades today:** The console reports acceptance only. It
cannot display or copy the refreshed link and does not imply that the
asynchronous operation is complete.

**Proposed platform change:** Add a secure read operation or a suitably scoped,
display-safe result projection for the refreshed invite link.

## 3. Group list reads have no server-side search or status filters

**What the contract provides:** `listInstanceGroups` and `listGroupMembers`
accept only cursor and limit parameters.

**What the console needs:** Group search and status filtering should apply to
the complete result set while preserving opaque cursor semantics.

**How the console degrades today:** Search and status filters run client-side
over pages already loaded in the browser. Matches on unloaded pages remain
absent until those pages are loaded.

**Proposed platform change:** Add documented normalized search and status
parameters, and return cursors scoped to the accepted filter set.

## 4. Active settings payload is not readable

**What the contract provides:** `SettingsResource` projects only ID, status,
profile, and update time.

**What the console needs:** The draft editor needs the complete active
configuration payload to prefill a proposed revision safely.

**How the console degrades today:** The draft starts blank and requires the
operator to paste a non-empty complete revision, explicitly acknowledge full
replacement, validate that exact draft, and complete a typed activation
confirmation. The console cannot present an authoritative field-level
comparison with the active revision.

**Proposed platform change:** Add an explicitly typed or schema-bounded active
configuration payload to the settings read projection.

## 5. Named Lists operations do not exist in the v1 contract

**What the contract provides:** Named Lists operations such as
`listNamedLists`, `createNamedList`, `getNamedList`, `updateNamedList`, and
`deleteNamedList` remain proposed-only operation IDs.

**What the console needs:** The Groups bulk-selection surface needs an
authoritative platform resource for reusable group collections.

**How the console degrades today:** The Named Lists and Groups bulk-selection
surface is deferred until the contract exists. The console does not emulate
lists in browser storage or loop platform commands client-side.

**Proposed platform change:** Add the proposed Named Lists resource,
collection reads, lifecycle operations, and membership commands to the public
contract.

## 6. Group role attribution is insufficient

**What the contract provides:** `GroupResource` has no field describing the
current operator's role, while `GroupMemberResource.role` is a free string.

**What the console needs:** The group inventory needs to state the operator's
own role per group and use a stable role vocabulary for management decisions.

**How the console degrades today:** The console cannot state the operator's own
role from the public projection. Member roles are rendered as supplied without
inferring permissions from free-form values. Management commands state that
the platform evaluates authorization on submission.

**Proposed platform change:** Add an `ourRole` field with a documented enum to
`GroupResource`, and constrain `GroupMemberResource.role` to the same stable
role vocabulary.
