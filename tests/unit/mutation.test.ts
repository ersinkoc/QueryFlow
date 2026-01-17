import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mutation, MutationInstance, setQueryContext } from '../../src/mutation.js';
import { Kernel } from '../../src/kernel.js';
import type { MutationOptions } from '../../src/types.js';

describe('MutationInstance', () => {
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

  it('should create mutation instance', () => {
    const m = mutation('/users');
    expect(m).toBeInstanceOf(MutationInstance);
  });

  it('should mutate data successfully', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, name: 'John' }),
    });

    const m = mutation('/users', { method: 'POST' });
    const data = await m.mutate({ name: 'John', email: 'john@example.com' });

    expect(data).toEqual({ id: 1, name: 'John' });
    expect(m.isSuccess()).toBe(true);
  });

  it('should handle errors', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const m = mutation('/users');

    await expect(m.mutate({ name: 'John' })).rejects.toThrow('Network error');
    expect(m.isError()).toBe(true);
  });

  it('should call callbacks', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1 }),
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onSettled = vi.fn();
    const onMutate = vi.fn();

    const m = mutation('/users', {
      method: 'POST',
      onSuccess,
      onError,
      onSettled,
      onMutate,
    });

    await m.mutate({ name: 'John' });

    expect(onMutate).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('should call mutateAsync', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1 }),
    });

    const m = mutation('/users');
    const data = await m.mutateAsync({ name: 'John' });

    expect(data).toEqual({ id: 1 });
  });

  it('should reset mutation state', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1 }),
    });

    const m = mutation('/users');
    await m.mutate({ name: 'John' });
    m.reset();

    expect(m.isIdle()).toBe(true);
    expect(m.getData()).toBeUndefined();
  });

  it('should notify state changes', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1 }),
    });

    const m = mutation('/users');
    const listener = vi.fn();
    m.onStateChange(listener);
    await m.mutate({ name: 'John' });

    expect(listener).toHaveBeenCalled();
  });
});
