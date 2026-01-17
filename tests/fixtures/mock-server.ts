import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let mockServer: any;

export function setupMockServer() {
  beforeEach(() => {
    mockServer = {
      requests: new Map<string, any>(),
      mock: vi.fn(),
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      mockServer.requests.set(url, { url });
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: 'mocked' }),
      });
    });
  });

  afterEach(() => {
    mockServer.requests.clear();
    vi.unmockAll();
  });
}

export function getMockRequest(url: string) {
  return mockServer?.requests.get(url);
}

export function mockResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: async () => data,
  });
}
