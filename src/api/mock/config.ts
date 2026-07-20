export const MOCK_API_ORIGIN = 'http://mock.omniwa.local';
export const MOCK_API_KEY = 'mock-admin-key';

export function isMockApiOrigin(baseUrl: string): boolean {
  try {
    return new URL(baseUrl).origin === MOCK_API_ORIGIN;
  } catch {
    return false;
  }
}
