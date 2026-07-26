# Deployment

OmniWA Console ships as one immutable SPA image. A build contains one route
manifest and one stylesheet; there is no presentation-generation switch.

## Build and image identity

Build the production artifact offline with:

```sh
pnpm build
```

The container build accepts `VITE_DEFAULT_API_BASE_URL` for the default API
origin. Runtime operators may still connect to another allowed origin from the
memory-only connect flow.

Published images must be identified by source revision and immutable digest.
Tags are discovery handles only; staging and production compose definitions pin
the digest that was reviewed. Do not rebuild an image during promotion.

## Verification gates

Before publishing or promoting an image:

1. run `git diff --check`, `pnpm test`, and `pnpm check`;
2. confirm the container starts as its non-root user and `/healthz` succeeds;
3. smoke `/`, `/overview`, and representative direct routes through the real
   reverse proxy to verify SPA fallback and security headers;
4. confirm the deployed revision and digest match the reviewed candidate;
5. exercise the credential boundary relevant to the target environment and
   record any credential-migration evidence in
   [CREDENTIAL_ROLLOUT_EVIDENCE.md](CREDENTIAL_ROLLOUT_EVIDENCE.md).

A zero-instance environment is deployment smoke evidence only. It cannot prove
credential adoption, projection readiness, rate-limit behavior, or operator
journeys that require representative data.

## Promotion

Promote the same digest from staging to production after the relevant route,
scope, accessibility, responsive, and failure-state checks pass. Record the
revision, digest, target, verification time, and approver in the deployment
system of record.

## Rollback

Rollback redeploys the last reviewed healthy image digest. Never rebuild an old
revision or restore removed source code. After rollback, verify `/healthz`, SPA
deep links, the reported revision, and the pinned digest before declaring the
service recovered.
