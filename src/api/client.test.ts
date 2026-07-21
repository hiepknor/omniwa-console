import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApiClient, DEFAULT_BASE_URL } from './client';

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
});
