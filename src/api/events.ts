import type { QueryKey } from '@tanstack/react-query';

import { instanceKeys, queryKeys } from './keys';

export type RealtimeEventEnvelope = {
  id: string;
  cursor: string;
  type: string;
  version: string;
  timestamp: string;
  dataClassification: string;
  source: string;
  payload: Record<string, string | number | boolean | null>;
  resourceRef?: string;
  correlationId?: string;
};

export type NormalizedRealtimeEvent = {
  id: string;
  cursor: string;
  type: string;
  resource: string;
  resourceId?: string;
  instanceId?: string;
  occurredAt: string;
};

export type StreamStatus = 'connecting' | 'live' | 'reconnecting' | 'polling';

export type StreamBatch = {
  events: NormalizedRealtimeEvent[];
  cursorStatus: 'no_cursor' | 'ok' | 'not_found' | 'expired' | undefined;
  isBackfill: boolean;
  isGap: boolean;
};

export type EventStreamOptions = {
  baseUrl: string;
  apiKey: string;
  onBatch(batch: StreamBatch): void;
  onStatus(status: StreamStatus): void;
  onAuthError(): void;
  isPaused?(): boolean;
};

export type EventStreamHandle = { close(): void };

const STREAM_ROTATE_MS = 4_000;
const POLLING_PROBE_MS = 60_000;
const PAUSE_POLL_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;
const BACKLOG_BATCH_SIZE = 100;

type CursorStatus = StreamBatch['cursorStatus'];

type ParsedStream = {
  events: NormalizedRealtimeEvent[];
  lastCursor?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSafeScalar(value: unknown): value is string | number | boolean | null {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function isScalarRecord(value: unknown): value is RealtimeEventEnvelope['payload'] {
  return isRecord(value) && Object.values(value).every(isSafeScalar);
}

function optionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string';
}

function isRealtimeEventEnvelope(value: unknown): value is RealtimeEventEnvelope {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.cursor === 'string' &&
    typeof value.type === 'string' &&
    typeof value.version === 'string' &&
    typeof value.timestamp === 'string' &&
    typeof value.dataClassification === 'string' &&
    typeof value.source === 'string' &&
    isScalarRecord(value.payload) &&
    optionalString(value.resourceRef) &&
    optionalString(value.correlationId)
  );
}

function normalizeEvent(envelope: RealtimeEventEnvelope): NormalizedRealtimeEvent {
  const resource = envelope.type.split('.')[0] ?? '';
  const normalized: NormalizedRealtimeEvent = {
    id: envelope.id,
    cursor: envelope.cursor,
    type: envelope.type,
    resource,
    occurredAt: envelope.timestamp,
  };

  if (envelope.resourceRef !== undefined) normalized.resourceId = envelope.resourceRef;
  if (resource === 'instance' && envelope.resourceRef !== undefined) {
    normalized.instanceId = envelope.resourceRef;
  }

  return normalized;
}

async function parseEventStream(body: ReadableStream<Uint8Array> | null): Promise<ParsedStream> {
  if (body === null) return { events: [] };

  const reader = body.getReader();
  const decoder = new TextDecoder();
  const events: NormalizedRealtimeEvent[] = [];
  let lastCursor: string | undefined;
  let buffered = '';
  let dataLines: string[] = [];
  let eventId: string | undefined;

  const dispatch = () => {
    if (dataLines.length === 0) {
      eventId = undefined;
      return;
    }

    if (eventId) lastCursor = eventId;

    try {
      const value: unknown = JSON.parse(dataLines.join('\n'));
      if (isRealtimeEventEnvelope(value)) {
        events.push(normalizeEvent(value));
        if (!eventId) lastCursor = value.cursor;
      }
    } catch {
      // Malformed event data is intentionally ignored without disrupting the stream.
    }

    dataLines = [];
    eventId = undefined;
  };

  const processLine = (line: string) => {
    if (line === '') {
      dispatch();
      return;
    }
    if (line.startsWith(':')) return;

    const colonIndex = line.indexOf(':');
    const field = colonIndex === -1 ? line : line.slice(0, colonIndex);
    let value = colonIndex === -1 ? '' : line.slice(colonIndex + 1);
    if (value.startsWith(' ')) value = value.slice(1);

    if (field === 'data') dataLines.push(value);
    if (field === 'id' && !value.includes('\0')) eventId = value;
  };

  while (true) {
    const { done, value } = await reader.read();
    buffered += done ? decoder.decode() : decoder.decode(value, { stream: true });

    let newlineIndex = buffered.indexOf('\n');
    while (newlineIndex !== -1) {
      let line = buffered.slice(0, newlineIndex);
      buffered = buffered.slice(newlineIndex + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      processLine(line);
      newlineIndex = buffered.indexOf('\n');
    }

    if (done) break;
  }

  if (buffered.endsWith('\r')) buffered = buffered.slice(0, -1);
  if (buffered !== '') processLine(buffered);
  dispatch();

  return { events, lastCursor };
}

function readCursorStatus(response: Response): CursorStatus {
  const value = response.headers.get('x-omniwa-cursor-status');
  if (value === 'no_cursor' || value === 'ok' || value === 'not_found' || value === 'expired') {
    return value;
  }
  return undefined;
}

export function openEventStream(options: EventStreamOptions): EventStreamHandle {
  const streamUrl = `${options.baseUrl.replace(/\/$/, '')}/v1/events/stream`;
  let dead = false;
  let cursor: string | undefined;
  let controller: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let consecutiveFailures = 0;
  let hasFailureGap = false;

  const emitStatus = (status: StreamStatus) => {
    if (dead) return;
    try {
      options.onStatus(status);
    } catch {
      // Consumer callbacks must not disrupt the transport loop.
    }
  };

  const schedule = (callback: () => void, delay: number) => {
    if (dead) return;
    timer = setTimeout(() => {
      timer = undefined;
      if (!dead) callback();
    }, delay);
  };

  let requestBatch: () => Promise<void>;

  const scheduleRotate = (delay: number) => {
    if (dead) return;

    let paused = false;
    try {
      paused = options.isPaused?.() ?? false;
    } catch {
      paused = false;
    }

    if (!paused) {
      schedule(() => void requestBatch(), delay);
      return;
    }

    schedule(() => scheduleRotate(0), PAUSE_POLL_MS);
  };

  const recordFailure = () => {
    consecutiveFailures += 1;
    hasFailureGap = true;

    if (consecutiveFailures >= 4) {
      emitStatus('polling');
      schedule(() => void requestBatch(), POLLING_PROBE_MS);
      return;
    }

    emitStatus('reconnecting');
    const baseDelay = Math.min(MAX_BACKOFF_MS, 1_000 * 2 ** (consecutiveFailures - 1));
    const jitteredDelay = baseDelay * (0.75 + Math.random() * 0.5);
    schedule(() => void requestBatch(), jitteredDelay);
  };

  const enterPolling = () => {
    consecutiveFailures += 1;
    hasFailureGap = true;
    emitStatus('polling');
    schedule(() => void requestBatch(), POLLING_PROBE_MS);
  };

  requestBatch = async () => {
    if (dead) return;

    const requestCursor = cursor;
    const url = requestCursor === undefined
      ? streamUrl
      : `${streamUrl}?cursor=${encodeURIComponent(requestCursor)}`;
    controller = new AbortController();

    try {
      const response = await fetch(url, {
        headers: { 'x-api-key': options.apiKey, accept: 'text/event-stream' },
        signal: controller.signal,
      });
      if (dead) return;

      if (response.status === 401) {
        dead = true;
        controller = undefined;
        try {
          options.onAuthError();
        } catch {
          // Authentication handling belongs to the consumer.
        }
        return;
      }

      const contentType = response.headers.get('content-type')?.toLowerCase();
      if (
        response.status === 403 ||
        response.status === 404 ||
        response.status === 405 ||
        (response.ok && !contentType?.startsWith('text/event-stream'))
      ) {
        controller = undefined;
        enterPolling();
        return;
      }

      if (response.status === 429 || response.status >= 500) {
        controller = undefined;
        recordFailure();
        return;
      }

      if (!response.ok) {
        controller = undefined;
        recordFailure();
        return;
      }

      const parsed = await parseEventStream(response.body);
      if (dead) return;
      controller = undefined;

      const cursorStatus = readCursorStatus(response);
      const cursorGap = cursorStatus === 'not_found' || cursorStatus === 'expired';
      const batch: StreamBatch = {
        events: parsed.events,
        cursorStatus,
        isBackfill: requestCursor === undefined,
        isGap: cursorGap || hasFailureGap,
      };

      if (cursorGap) cursor = undefined;
      else if (parsed.lastCursor !== undefined) cursor = parsed.lastCursor;

      consecutiveFailures = 0;
      hasFailureGap = false;

      if (!dead) {
        try {
          options.onBatch(batch);
        } catch {
          // Consumer callbacks must not disrupt the transport loop.
        }
      }
      emitStatus('live');
      scheduleRotate(parsed.events.length === BACKLOG_BATCH_SIZE ? 0 : STREAM_ROTATE_MS);
    } catch (error: unknown) {
      controller = undefined;
      if (dead || (error instanceof DOMException && error.name === 'AbortError')) return;
      recordFailure();
    }
  };

  emitStatus('connecting');
  void requestBatch();

  return {
    close() {
      if (dead) return;
      dead = true;
      controller?.abort();
      controller = undefined;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    },
  };
}

const INVALIDATION_KEYS: Readonly<Record<string, readonly QueryKey[]>> = {
  instance: [instanceKeys.root, queryKeys.dashboard, queryKeys.actionRequired],
  session: [instanceKeys.root],
  message: [queryKeys.messageMetrics, queryKeys.queueMetrics, queryKeys.dashboard],
  media: [queryKeys.mediaMetrics, queryKeys.dashboard],
  webhook: [queryKeys.webhookMetrics],
  health: [
    queryKeys.health,
    queryKeys.healthReadiness,
    queryKeys.actionRequired,
    queryKeys.dashboard,
  ],
  guardrail: [queryKeys.actionRequired, queryKeys.dashboard],
  provider: [queryKeys.providerCapabilities],
};

/** Deduplicated union of TanStack query keys to invalidate for a batch (empty for unknown resources). */
export function invalidationKeysFor(events: readonly NormalizedRealtimeEvent[]): QueryKey[] {
  const seen = new Set<string>();
  const keys: QueryKey[] = [];

  for (const event of events) {
    for (const key of INVALIDATION_KEYS[event.resource] ?? []) {
      const serialized = JSON.stringify(key);
      if (seen.has(serialized)) continue;
      seen.add(serialized);
      keys.push(key);
    }
  }

  return keys;
}
