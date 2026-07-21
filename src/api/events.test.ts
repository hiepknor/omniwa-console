import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { instanceKeys, messageKeys, opsKeys, queryKeys } from './keys';
import {
  invalidationKeysFor,
  openEventStream,
  type NormalizedRealtimeEvent,
  type RealtimeEventEnvelope,
  type StreamBatch,
  type StreamStatus,
} from './events';

const BASE_URL = 'https://api.test.example';
const API_KEY = 'test-key';

function envelope(overrides: Partial<RealtimeEventEnvelope> & { id: string; cursor: string; type: string }): RealtimeEventEnvelope {
  return {
    version: '1',
    timestamp: '2026-07-20T00:00:00.000Z',
    dataClassification: 'internal',
    source: 'platform',
    payload: {},
    ...overrides,
  };
}

/** Build a `text/event-stream` Response body from event envelopes. */
function streamResponse(
  envelopes: RealtimeEventEnvelope[],
  init: { status?: number; cursorStatus?: string; contentType?: string } = {},
): Response {
  const body = envelopes
    .map((event) => `data: ${JSON.stringify(event)}\n\n`)
    .join('');
  const headers = new Headers();
  headers.set('content-type', init.contentType ?? 'text/event-stream');
  if (init.cursorStatus) headers.set('x-omniwa-cursor-status', init.cursorStatus);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(body));
      controller.close();
    },
  });
  return new Response(stream, { status: init.status ?? 200, headers });
}

type Harness = {
  batches: StreamBatch[];
  statuses: StreamStatus[];
  authErrors: number;
  options: Parameters<typeof openEventStream>[0];
};

function harness(overrides: Partial<Parameters<typeof openEventStream>[0]> = {}): Harness {
  const batches: StreamBatch[] = [];
  const statuses: StreamStatus[] = [];
  let authErrors = 0;
  return {
    batches,
    statuses,
    get authErrors() {
      return authErrors;
    },
    options: {
      baseUrl: BASE_URL,
      apiKey: API_KEY,
      onBatch: (batch) => batches.push(batch),
      onStatus: (status) => statuses.push(status),
      onAuthError: () => {
        authErrors += 1;
      },
      ...overrides,
    },
  };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('invalidationKeysFor', () => {
  const messageEvent: NormalizedRealtimeEvent = {
    id: 'e1',
    cursor: 'c1',
    type: 'message.delivered',
    resource: 'message',
    occurredAt: '2026-07-20T00:00:00.000Z',
  };

  it('returns no keys when there are no events', () => {
    expect(invalidationKeysFor([])).toEqual([]);
  });

  it('maps a resource to its query keys and always appends the events key', () => {
    const keys = invalidationKeysFor([messageEvent]);

    expect(keys).toContainEqual(messageKeys.root);
    expect(keys).toContainEqual(queryKeys.dashboard);
    expect(keys).toContainEqual(opsKeys.queue);
    // alwaysInvalidateKeys
    expect(keys).toContainEqual(opsKeys.events);
  });

  it('deduplicates keys shared across resources', () => {
    const instanceEvent: NormalizedRealtimeEvent = {
      ...messageEvent,
      id: 'e2',
      type: 'instance.connected',
      resource: 'instance',
    };
    const keys = invalidationKeysFor([messageEvent, instanceEvent]);

    const instanceRootMatches = keys.filter(
      (key) => JSON.stringify(key) === JSON.stringify(instanceKeys.root),
    );
    expect(instanceRootMatches).toHaveLength(1);
  });

  it('still emits the always-invalidate events key for an unknown resource', () => {
    const unknownEvent: NormalizedRealtimeEvent = {
      ...messageEvent,
      resource: 'not-a-real-resource',
    };
    expect(invalidationKeysFor([unknownEvent])).toEqual([opsKeys.events]);
  });
});

describe('openEventStream', () => {
  it('parses an SSE batch, normalizes events, and reports the live status', async () => {
    fetchMock.mockResolvedValueOnce(
      streamResponse(
        [
          envelope({ id: 'evt_1', cursor: 'cur_1', type: 'message.delivered', resourceRef: 'msg_1' }),
          envelope({ id: 'evt_2', cursor: 'cur_2', type: 'instance.connected', resourceRef: 'inst_1' }),
        ],
        { cursorStatus: 'ok' },
      ),
    );

    const h = harness();
    const handle = openEventStream(h.options);

    await vi.waitFor(() => expect(h.batches).toHaveLength(1));
    handle.close();

    const batch = h.batches[0];
    expect(batch.isBackfill).toBe(true);
    expect(batch.isGap).toBe(false);
    expect(batch.cursorStatus).toBe('ok');
    expect(batch.events).toEqual([
      {
        id: 'evt_1',
        cursor: 'cur_1',
        type: 'message.delivered',
        resource: 'message',
        resourceId: 'msg_1',
        occurredAt: '2026-07-20T00:00:00.000Z',
      },
      {
        id: 'evt_2',
        cursor: 'cur_2',
        type: 'instance.connected',
        resource: 'instance',
        resourceId: 'inst_1',
        instanceId: 'inst_1',
        occurredAt: '2026-07-20T00:00:00.000Z',
      },
    ]);
    expect(h.statuses).toContain('connecting');
    expect(h.statuses).toContain('live');
  });

  it('sends the x-api-key header and requests the stream endpoint', async () => {
    fetchMock.mockResolvedValueOnce(streamResponse([], { cursorStatus: 'no_cursor' }));

    const h = harness();
    const handle = openEventStream(h.options);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    handle.close();

    const [url, requestInit] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/v1/events/stream`);
    expect((requestInit as RequestInit).headers).toMatchObject({
      'x-api-key': API_KEY,
      accept: 'text/event-stream',
    });
  });

  it('ignores malformed event data without failing the batch', async () => {
    const goodEvent = envelope({ id: 'evt_ok', cursor: 'cur_ok', type: 'webhook.delivered' });
    const body = `data: {not json}\n\ndata: ${JSON.stringify(goodEvent)}\n\n`;
    const headers = new Headers({ 'content-type': 'text/event-stream' });
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(body));
        controller.close();
      },
    });
    fetchMock.mockResolvedValueOnce(new Response(stream, { status: 200, headers }));

    const h = harness();
    const handle = openEventStream(h.options);
    await vi.waitFor(() => expect(h.batches).toHaveLength(1));
    handle.close();

    expect(h.batches[0].events.map((event) => event.id)).toEqual(['evt_ok']);
  });

  it('invokes onAuthError and stops on a 401 response', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    const h = harness();
    const handle = openEventStream(h.options);

    await vi.waitFor(() => expect(h.authErrors).toBe(1));
    handle.close();

    expect(h.batches).toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to polling when the endpoint is unavailable (404)', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 404 }));

    const h = harness();
    const handle = openEventStream(h.options);

    await vi.waitFor(() => expect(h.statuses).toContain('polling'));
    handle.close();

    expect(h.batches).toHaveLength(0);
  });

  it('falls back to polling when a 200 response is not an event stream', async () => {
    fetchMock.mockResolvedValue(
      new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
    );

    const h = harness();
    const handle = openEventStream(h.options);

    await vi.waitFor(() => expect(h.statuses).toContain('polling'));
    handle.close();
  });

  it('enters the reconnecting state on a 5xx failure', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 503 }));

    const h = harness();
    const handle = openEventStream(h.options);

    await vi.waitFor(() => expect(h.statuses).toContain('reconnecting'));
    handle.close();
  });

  it('forwards the last cursor on the next request after a full backlog batch', async () => {
    const backlog = Array.from({ length: 100 }, (_, index) =>
      envelope({ id: `evt_${index}`, cursor: `cur_${index}`, type: 'message.delivered' }),
    );
    fetchMock
      .mockResolvedValueOnce(streamResponse(backlog, { cursorStatus: 'ok' }))
      .mockResolvedValue(streamResponse([], { cursorStatus: 'ok' }));

    const h = harness();
    const handle = openEventStream(h.options);

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    handle.close();

    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE_URL}/v1/events/stream`);
    expect(fetchMock.mock.calls[1][0]).toBe(`${BASE_URL}/v1/events/stream?cursor=cur_99`);
  });

  it('marks the batch as a gap when the cursor is reported expired', async () => {
    fetchMock.mockResolvedValueOnce(
      streamResponse([envelope({ id: 'evt_1', cursor: 'cur_1', type: 'message.delivered' })], {
        cursorStatus: 'expired',
      }),
    );

    const h = harness();
    const handle = openEventStream(h.options);
    await vi.waitFor(() => expect(h.batches).toHaveLength(1));
    handle.close();

    expect(h.batches[0].isGap).toBe(true);
    expect(h.batches[0].cursorStatus).toBe('expired');
  });

  it('does not deliver a batch when closed before the response resolves', async () => {
    let resolveFetch: (response: Response) => void = () => undefined;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const h = harness();
    const handle = openEventStream(h.options);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());

    handle.close();
    resolveFetch(streamResponse([envelope({ id: 'evt_1', cursor: 'cur_1', type: 'message.delivered' })]));

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(h.batches).toHaveLength(0);
  });
});
