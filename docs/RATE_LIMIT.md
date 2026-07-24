# Rate-Limit Contract

OmniWA GO owns both rate-limit safety systems. The Console must respect their
public contract and must not create a second limiter or retry engine in browser
state.

## Information-query safety

Residual WhatsApp information queries are protected at the service layer for
HTTP and internal callers by:

- a per-instance token bucket;
- single-flight coalescing by instance, operation, and resource;
- a per-instance circuit breaker;
- immediate breaker opening on upstream 429;
- no WhatsApp probes during cooldown;
- a single trial query in half-open state.

Projection reads do not call WhatsApp. The Console must not reintroduce live
reads as a fallback when a projection is unavailable.

## Outbound safety

The outbound limiter is independent from the information-query limiter. An
outbound rejection uses code `outbound_rate_limited`; it does not imply an
information projection failure.

## Public response

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 90
Content-Type: application/json
```

```json
{
  "error": "rate_limited",
  "code": "rate_limited",
  "retryAfter": 90
}
```

Outbound responses use the same shape with `outbound_rate_limited`.

## Frontend behavior

1. Preserve the machine-readable code.
2. Read `Retry-After` first; use `retryAfter` only when the header is absent or
   invalid.
3. Show a visible countdown and explain that automatic retries are disabled.
4. Allow at most one manual read retry after cooldown, with 250–1000ms jitter.
5. Clear timers when the error changes or the component unmounts.
6. Do not automatically retry mutations; their outcome may be uncertain.
7. Do not turn known 429 responses into generic transport or internal errors.
8. Do not poll WhatsApp-live endpoints in response to rate limiting.

TanStack Query's global retry policy permits one retry only for retryable
transient 5xx failures. `rate_limited` and `projection_not_ready` are explicitly
excluded.

## Verification

Regression tests cover header precedence, body fallback, error categorization,
countdown termination, jitter bounds, and duplicate scheduling. A feature that
adds a new mutation must confirm that its query/mutation configuration does not
enable automatic retry.
