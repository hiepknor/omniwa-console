# Contract UI Matrix

This document is the reviewed UI disposition for every public operation in the
vendored OmniWA GO contract. `integrated-console` operations belong to current
panels; all other decisions keep the operation outside Console navigation until
their documented exit criteria are met.

The matrix is a product boundary, not a promise that every backend endpoint
needs a screen. `deferred-product-workflow` operations remain outside navigation until a
complete operator workflow is approved; `deferred-backend-risk` operations are
blocked by documented backend reliability concerns; and `external-client`
operations belong to the passkey helper rather than Console.

Deferred and external operations are grouped into accountable decision units in
[CONTRACT_BACKLOG.md](CONTRACT_BACKLOG.md). That register records role ownership
and exit criteria without treating a deferred endpoint as an approved panel.

Scope values are derived from the backend route middleware, not from URL shape
alone. Capability names come from the backend Console handoff. A value of
`none-advertised` means the backend currently publishes no dedicated capability
for that operation; it does not imply availability or readiness.

## Complete operation inventory

| Operation | Scope | Capability | Data/action mode | Target workflow | Decision |
| --- | --- | --- | --- | --- | --- |
| `POST /call/reject` | instance | `none-advertised` | command | call-control | deferred-product-workflow |
| `GET /campaigns` | instance | `campaign_orchestration` | control-plane-read | campaign-delivery | integrated-console |
| `GET /campaigns/{campaignId}` | instance | `campaign_orchestration` | control-plane-read | campaign-delivery | integrated-console |
| `GET /campaigns/{campaignId}/audit` | instance | `campaign_orchestration` | control-plane-read | campaign-delivery | integrated-console |
| `GET /campaigns/{campaignId}/recipients` | instance | `campaign_orchestration` | control-plane-read | campaign-delivery | integrated-console |
| `POST /campaigns` | instance | `campaign_orchestration` | command | campaign-delivery | integrated-console |
| `POST /campaigns/{campaignId}/abort` | instance | `campaign_orchestration` | command | campaign-delivery | integrated-console |
| `POST /campaigns/{campaignId}/pause` | instance | `campaign_orchestration` | command | campaign-delivery | integrated-console |
| `POST /campaigns/{campaignId}/resume` | instance | `campaign_orchestration` | command | campaign-delivery | integrated-console |
| `POST /campaigns/{campaignId}/schedule` | instance | `campaign_orchestration` | command | campaign-delivery | integrated-console |
| `POST /campaigns/{campaignId}/start` | instance | `campaign_orchestration` | command | campaign-delivery | integrated-console |
| `GET /label/info/{labelId}` | instance | `labels_projection` | projection-read | contacts-and-labels | integrated-console |
| `GET /label/list` | instance | `labels_projection` | projection-read | contacts-and-labels | integrated-console |
| `GET /user/blocklist` | instance | `none-advertised` | live-read | contacts-and-labels | deferred-product-workflow |
| `GET /user/contact/{contactId}` | instance | `contacts_projection` | projection-read | contacts-and-labels | integrated-console |
| `GET /user/contacts` | instance | `contacts_projection` | projection-read | contacts-and-labels | integrated-console |
| `GET /user/contacts/search` | instance | `contacts_projection` | projection-read | contacts-and-labels | integrated-console |
| `GET /user/privacy` | instance | `none-advertised` | live-read | contacts-and-labels | deferred-product-workflow |
| `POST /label/chat` | instance | `none-advertised` | command | contacts-and-labels | deferred-product-workflow |
| `POST /label/edit` | instance | `none-advertised` | command | contacts-and-labels | deferred-product-workflow |
| `POST /label/message` | instance | `none-advertised` | command | contacts-and-labels | deferred-product-workflow |
| `POST /unlabel/chat` | instance | `none-advertised` | command | contacts-and-labels | deferred-product-workflow |
| `POST /unlabel/message` | instance | `none-advertised` | command | contacts-and-labels | deferred-product-workflow |
| `POST /user/avatar` | instance | `none-advertised` | live-read | contacts-and-labels | deferred-product-workflow |
| `POST /user/block` | instance | `none-advertised` | command | contacts-and-labels | deferred-product-workflow |
| `POST /user/check` | instance | `none-advertised` | live-read | contacts-and-labels | deferred-product-workflow |
| `POST /user/info` | instance | `none-advertised` | live-read | contacts-and-labels | deferred-product-workflow |
| `POST /user/privacy` | instance | `none-advertised` | command | contacts-and-labels | deferred-product-workflow |
| `POST /user/profileName` | instance | `none-advertised` | command | contacts-and-labels | deferred-product-workflow |
| `POST /user/profilePicture` | instance | `none-advertised` | command | contacts-and-labels | deferred-product-workflow |
| `POST /user/profileStatus` | instance | `none-advertised` | command | contacts-and-labels | deferred-product-workflow |
| `POST /user/unblock` | instance | `none-advertised` | command | contacts-and-labels | deferred-product-workflow |
| `POST /media-assets` | instance | `group_photo_assets` or `conversation_media_assets` | command | shared-media-assets | integrated-console |
| `GET /media-assets/{mediaId}` | instance | `group_photo_assets` or `conversation_media_assets` | control-plane-read | shared-media-assets | integrated-console |
| `DELETE /media-assets/{mediaId}` | instance | `none-advertised` | command | shared-media-assets | deferred-product-workflow |
| `GET /media-assets/{mediaId}/content` | instance | `group_photo_assets` or `conversation_media_assets` | binary-read | shared-media-assets | integrated-console |
| `GET /chat/{chatId}/messages` | instance | `messages_projection` | projection-read | conversations | integrated-console |
| `GET /chat/info/{chatId}` | instance | `chats_projection` | projection-read | conversations | integrated-console |
| `GET /chat/list` | instance | `chats_projection` | projection-read | conversations | integrated-console |
| `GET /message/{messageId}` | instance | `messages_projection` | projection-read | conversations | integrated-console |
| `GET /message/{messageId}/delivery` | instance | `messages_projection` | projection-read | conversations | integrated-console |
| `GET /polls/{pollMessageId}/results` | instance | `none-advertised` | live-read | conversations | deferred-product-workflow |
| `POST /chat/archive` | instance | `none-advertised` | command | conversations | deferred-backend-risk |
| `POST /chat/history-sync` | instance | `none-advertised` | command | conversations | deferred-product-workflow |
| `POST /chat/mute` | instance | `none-advertised` | command | conversations | deferred-backend-risk |
| `POST /chat/pin` | instance | `none-advertised` | command | conversations | deferred-backend-risk |
| `POST /chat/unarchive` | instance | `none-advertised` | command | conversations | deferred-backend-risk |
| `POST /chat/unmute` | instance | `none-advertised` | command | conversations | deferred-backend-risk |
| `POST /chat/unpin` | instance | `none-advertised` | command | conversations | deferred-backend-risk |
| `POST /message/delete` | instance | `none-advertised` | command | conversations | deferred-product-workflow |
| `POST /message/downloadmedia` | instance | `none-advertised` | command | conversations | deferred-product-workflow |
| `POST /message/edit` | instance | `none-advertised` | command | conversations | deferred-product-workflow |
| `POST /message/markplayed` | instance | `none-advertised` | command | conversations | deferred-product-workflow |
| `POST /message/markread` | instance | `none-advertised` | command | conversations | deferred-product-workflow |
| `POST /message/presence` | instance | `none-advertised` | command | conversations | deferred-product-workflow |
| `POST /message/react` | instance | `none-advertised` | command | conversations | deferred-product-workflow |
| `POST /message/status` | instance | `none-advertised` | live-read | conversations | deferred-product-workflow |
| `POST /send/button` | instance | `outbound_rate_limit` | command | conversations | deferred-product-workflow |
| `POST /send/carousel` | instance | `outbound_rate_limit` | command | conversations | deferred-product-workflow |
| `POST /send/contact` | instance | `outbound_rate_limit` | command | conversations | deferred-product-workflow |
| `POST /send/link` | instance | `outbound_rate_limit` | command | conversations | deferred-product-workflow |
| `POST /send/list` | instance | `outbound_rate_limit` | command | conversations | deferred-product-workflow |
| `POST /send/location` | instance | `outbound_rate_limit` | command | conversations | deferred-product-workflow |
| `POST /send/media` | instance | `outbound_rate_limit` | command | conversations | integrated-console |
| `POST /send/poll` | instance | `outbound_rate_limit` | command | conversations | deferred-product-workflow |
| `POST /send/status/media` | instance | `outbound_rate_limit` | command | conversations | deferred-product-workflow |
| `POST /send/status/text` | instance | `outbound_rate_limit` | command | conversations | deferred-product-workflow |
| `POST /send/sticker` | instance | `outbound_rate_limit` | command | conversations | deferred-product-workflow |
| `POST /send/text` | instance | `outbound_rate_limit` | command | conversations | integrated-console |
| `GET /events` | instance | `events_projection` | projection-read | event-history | integrated-console |
| `GET /passkey-ceremony/{token}` | public-ceremony | `none-advertised` | live-read | external-passkey-helper | external-client |
| `POST /passkey-ceremony/{token}/confirm` | public-ceremony | `none-advertised` | command | external-passkey-helper | external-client |
| `POST /passkey-ceremony/{token}/response` | public-ceremony | `none-advertised` | command | external-passkey-helper | external-client |
| `GET /group/list` | instance | `groups_projection` | projection-read | groups-and-communities | integrated-console |
| `GET /group/myall` | instance | `none-advertised` | live-read | groups-and-communities | deferred-backend-risk |
| `GET /group/search` | instance | `groups_projection` | projection-read | groups-and-communities | integrated-console |
| `POST /community/add` | instance | `none-advertised` | command | groups-and-communities | deferred-product-workflow |
| `POST /community/create` | instance | `none-advertised` | command | groups-and-communities | deferred-product-workflow |
| `POST /community/remove` | instance | `none-advertised` | command | groups-and-communities | deferred-product-workflow |
| `POST /group/create` | instance | `none-advertised` | command | groups-and-communities | integrated-console |
| `POST /group/description` | instance | `none-advertised` | command | groups-and-communities | integrated-console |
| `POST /group/info` | instance | `groups_projection` | projection-read | groups-and-communities | integrated-console |
| `POST /group/invitelink` | instance | `none-advertised` | projection-read-or-command | groups-and-communities | integrated-console |
| `POST /group/join` | instance | `none-advertised` | command | groups-and-communities | deferred-product-workflow |
| `POST /group/leave` | instance | `none-advertised` | command | groups-and-communities | integrated-console |
| `POST /group/name` | instance | `none-advertised` | command | groups-and-communities | integrated-console |
| `POST /group/participant` | instance | `none-advertised` | command | groups-and-communities | integrated-console |
| `POST /group/photo` | instance | `none-advertised` | command | groups-and-communities | deferred-product-workflow |
| `POST /group/settings` | instance | `none-advertised` | command | groups-and-communities | integrated-console |
| `DELETE /instance/delete/{instanceId}` | admin | `none-advertised` | command | instance-fleet | integrated-console |
| `DELETE /instance/logout` | instance | `none-advertised` | command | instance-fleet | integrated-console |
| `DELETE /instance/proxy/{instanceId}` | admin | `none-advertised` | command | instance-fleet | deferred-product-workflow |
| `GET /instance/{instanceId}/advanced-settings` | instance | `none-advertised` | live-read | instance-fleet | integrated-console |
| `GET /instance/all` | admin | `none-advertised` | control-plane-read | instance-fleet | deferred-product-workflow |
| `GET /instance/credential-health` | admin | `instance_credential_health` | control-plane-read | instance-fleet | integrated-console |
| `GET /instance/info/{instanceId}` | admin | `none-advertised` | control-plane-read | instance-fleet | deferred-product-workflow |
| `GET /instance/logs/{instanceId}` | admin | `none-advertised` | control-plane-read | instance-fleet | deferred-product-workflow |
| `GET /instance/metadata` | admin | `instance_metadata_views` | control-plane-read | instance-fleet | integrated-console |
| `GET /instance/metadata/{instanceId}` | admin | `instance_metadata_views` | control-plane-read | instance-fleet | integrated-console |
| `GET /instance/qr` | instance | `none-advertised` | live-read | instance-fleet | integrated-console |
| `GET /instance/status` | instance | `none-advertised` | live-read | instance-fleet | integrated-console |
| `POST /instance/connect` | instance | `none-advertised` | command | instance-fleet | integrated-console |
| `POST /instance/create` | admin | `none-advertised` | command | instance-fleet | integrated-console |
| `POST /instance/disconnect` | instance | `none-advertised` | command | instance-fleet | integrated-console |
| `POST /instance/forcereconnect/{instanceId}` | admin | `none-advertised` | command | instance-fleet | deferred-product-workflow |
| `POST /instance/pair` | instance | `none-advertised` | command | instance-fleet | deferred-product-workflow |
| `POST /instance/proxy/{instanceId}` | admin | `none-advertised` | command | instance-fleet | deferred-product-workflow |
| `POST /instance/reconnect` | instance | `none-advertised` | command | instance-fleet | integrated-console |
| `POST /instance/rotate-token/{instanceId}` | admin | `instance_token_rotation` | command | instance-fleet | integrated-console |
| `PUT /instance/{instanceId}/advanced-settings` | instance | `none-advertised` | command | instance-fleet | integrated-console |
| `GET /newsletter/list` | instance | `none-advertised` | live-read | newsletters | deferred-product-workflow |
| `POST /newsletter/create` | instance | `none-advertised` | command | newsletters | deferred-product-workflow |
| `POST /newsletter/info` | instance | `none-advertised` | live-read | newsletters | deferred-product-workflow |
| `POST /newsletter/link` | instance | `none-advertised` | command | newsletters | deferred-product-workflow |
| `POST /newsletter/messages` | instance | `none-advertised` | live-read | newsletters | deferred-product-workflow |
| `POST /newsletter/subscribe` | instance | `none-advertised` | command | newsletters | deferred-product-workflow |
| `GET /server/capabilities` | admin-or-instance | `none-advertised` | control-plane-read | platform-observability | integrated-console |
| `GET /server/health` | admin-or-instance | `none-advertised` | control-plane-read | platform-observability | integrated-console |
| `GET /server/overview` | admin-or-instance | `none-advertised` | control-plane-read | platform-observability | integrated-console |
| `GET /server/projection-health` | admin-or-instance | `none-advertised` | control-plane-read | platform-observability | integrated-console |
| `GET /server/projection-failures` | admin | `projection_failure_operations` | control-plane-read | projection-recovery | integrated-console |
| `POST /server/projection-failures/discard` | admin | `projection_failure_operations` | command | projection-recovery | integrated-console |
| `POST /server/projection-failures/replay` | admin | `projection_failure_operations` | command | projection-recovery | integrated-console |
