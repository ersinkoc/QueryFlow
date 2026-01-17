import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { query, QueryInstance, setQueryContext } from '../../src/query.js';
import { Kernel } from '../../src/kernel.js';
import type { QueryOptions } from '../../src/types.js';

describe('QueryInstance', () => {
  let kernel: Kernel;

  beforeEach(async () => {
    kernel = new Kernel({ baseUrl: 'https://api.com' });
    await kernel.initialize();
    setQueryContext(kernel);
  });

  afterEach(() => {
    kernel.destroy();
    setQueryContext(null as any);
  });

  it('should create query instance', () => {
    const q = query('/users');
    expect(q).toBeInstanceOf(QueryInstance);
  });

  it('should fetch data successfully', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [{ id: 1, name: 'John' }] }),
    });

    const q = query('/users');
    const data = await q.fetch();

    expect(data).toEqual({ users: [{ id:1, name: 'John' }] });
    expect(q.isSuccess()).toBe(true);
  });

  it('should handle errors', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const q = query('/users');

    await expect(q.fetch()).rejects.toThrow('Network error');
    expect(q.isError()).toBe(true);
  });

  it('should apply select transformation', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [{ id: 1, name: 'John' }] }),
    });

    const q = query<{ names: string[] }>('/users', {
      select: (data: any) => ({ names: data.users.map((u: any) => u.name) }),
    });
    const data = await q.fetch();

    expect(data).toEqual({ names: ['John'] });
  });

  it('should use placeholder data when disabled', async () => {
    const q = query('/users', {
      enabled: false,
      placeholderData: { users: [] },
    });

    const data = await q.fetch();
    expect(data).toEqual({ users: [] });
  });

  it('should call callbacks', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'value' }),
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onSettled = vi.fn();

    const q = query('/test', { onSuccess, onError, onSettled });
    await q.fetch();

    expect(onSuccess).toHaveBeenCalledWith({ data: 'value' });
    expect(onSettled).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('should return safe result with fetchSafe', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'value' }),
    });

    const q = query('/test');
    const result = await q.fetchSafe();

    expect(result).toEqual({ data: { data: 'value' }, error: null });
  });

  it('should refetch data', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'value' }),
    });

    const q = query('/test');
    await q.fetch();
    await q.refetch();

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should notify state changes', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'value' }),
    });

    const q = query('/test');
    const listener = vi.fn();
    q.onStateChange(listener);
    await q.fetch();

    expect(listener).toHaveBeenCalled();
  });
});

describe('query', () => {
  it('should throw error without client', () => {
    setQueryContext(null as any);
    expect(() => query('/test')).toThrow('No QueryFlow client available');
  });
});
