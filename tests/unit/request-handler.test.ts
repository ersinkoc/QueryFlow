import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RequestHandler, requestHandlerPlugin } from '../../src/plugins/core/request-handler.js';
import type { ClientConfig } from '../../src/types.js';

describe('RequestHandler', () => {
  let requestHandler: RequestHandler;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    const config: ClientConfig = { baseUrl: 'https://api.com' };
    requestHandler = new RequestHandler(config);
  });

  it('should fetch data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'value' }),
    });

    const result = await requestHandler.fetch('/test');

    expect(result.data).toEqual({ data: 'value' });
    expect(mockFetch).toHaveBeenCalledWith('https://api.com/test', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: expect.any(AbortSignal),
    });
  });

  it('should handle network errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Not found' }),
    });

    await expect(requestHandler.fetch('/test')).rejects.toThrow('HTTP 404');
  });

  it('should handle timeout', async () => {
    requestHandler = new RequestHandler({ baseUrl: 'https://api.com', timeout: 100 });

    mockFetch.mockImplementation((_url: string, options: { signal?: AbortSignal }) => {
      return new Promise((_, reject) => {
        const signal = options?.signal;
        if (signal) {
          signal.addEventListener('abort', () => {
            const error = new DOMException('Aborted', 'AbortError');
            reject(error);
          });
        }
      });
    });

    await expect(requestHandler.fetch('/test', { retry: false })).rejects.toThrow(/Request timed out/);
  });

  it('should dedupe concurrent requests', async () => {
    mockFetch.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({ data: 'value' }) }), 100))
    );

    const [result1, result2] = await Promise.all([
      requestHandler.fetch('/test'),
      requestHandler.fetch('/test'),
    ]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result1.data).toEqual({ data: 'value' });
    expect(result2.data).toEqual({ data: 'value' });
  });

  it('should retry on failure', async () => {
    let attempts = 0;
    mockFetch.mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Network error');
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: 'value' }) });
    });

    const result = await requestHandler.fetch('/test', { retry: 3 });

    expect(result.data).toEqual({ data: 'value' });
    expect(attempts).toBe(3);
  });

  it('should build URL with params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'value' }),
    });

    await requestHandler.fetch('/users/:id', { params: { id: '123' } });

    expect(mockFetch).toHaveBeenCalledWith('https://api.com/users/123', expect.any(Object));
  });

  it('should build URL with search params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'value' }),
    });

    await requestHandler.fetch('/users', { searchParams: { page: 1, limit: 10 } });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.com/users?page=1&limit=10',
      expect.any(Object)
    );
  });
});

describe('requestHandlerPlugin', () => {
  it('should install plugin and add requestHandler to context', async () => {
    const { Kernel } = await import('../../src/kernel.js');
    const kernel = new Kernel();
    requestHandlerPlugin.install(kernel);

    expect(kernel.getContext().requestHandler).toBeInstanceOf(RequestHandler);
  });
});
