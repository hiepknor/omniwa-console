import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApiClient, credentialScopeForResponse, DEFAULT_BASE_URL } from './client';
import { ApiFailure, unwrap } from './envelopes';

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ message: 'success', data: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createApiClient', () => {
  it('sends the omniwa-go apikey header and resolves against the session base URL', async () => {
    const client = createApiClient({ baseUrl: 'https://go.example', apiKey: 'instance-token-123' });
    await client.GET('/instance/all');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.url).toBe('https://go.example/instance/all');
    expect(request.headers.get('apikey')).toBe('instance-token-123');
    expect(request.headers.get('x-api-key')).toBeNull();
  });

  it('defaults to the omniwa-go dev origin', () => {
    expect(DEFAULT_BASE_URL).toBe('http://localhost:4000');
  });

  it('marks responses from a scoped client without exposing the scope on the wire', async () => {
    const client = createApiClient({ baseUrl: 'https://go.example', apiKey: 'instance-token-123' }, 'instance');
    const result = await client.GET('/instance/status');
    const request = fetchMock.mock.calls[0][0] as Request;

    expect(credentialScopeForResponse(result.response)).toBe('instance');
    expect(request.headers.get('x-omniwa-credential-scope')).toBeNull();
  });

  it('propagates instance scope through normalized authentication failures', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'expired' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    }));
    const client = createApiClient({ baseUrl: 'https://go.example', apiKey: 'expired-token' }, 'instance');

    await expect((async () => unwrap(await client.GET('/instance/status')))()).rejects.toMatchObject({
      category: 'authentication',
      credentialScope: 'instance',
    } satisfies Partial<ApiFailure>);
  });
});
