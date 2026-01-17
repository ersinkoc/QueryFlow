import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from '../../src/client.js';

describe('Client', () => {
  let client: any;

  beforeEach(() => {
    client = createClient({ baseUrl: 'https://api.com' });
  });

  afterEach(() => {
    client.destroy();
  });

  it('should create client with config', () => {
    expect(client.getKernel()).toBeDefined();
    expect(client.getKernel().getConfig().baseUrl).toBe('https://api.com');
  });

  it('should provide cache API', () => {
    client.cache.set('test', { data: 'value' });
    expect(client.cache.get('test')).toEqual({ data: 'value' });
  });

  it('should invalidate cache', () => {
    client.cache.set('/users/123', { id: 123 });
    client.cache.set('/users/456', { id: 456 });

    client.cache.invalidate('/users/*');

    expect(client.cache.get('/users/123')).toBeUndefined();
    expect(client.cache.get('/users/456')).toBeUndefined();
  });

  it('should clear cache', () => {
    client.cache.set('test1', { data: 'value1' });
    client.cache.set('test2', { data: 'value2' });

    client.cache.clear();

    expect(client.cache.get('test1')).toBeUndefined();
    expect(client.cache.get('test2')).toBeUndefined();
  });

  it('should update cache', () => {
    client.cache.set('test', { data: 'value' });
    client.cache.update('test', (data: any) => ({ ...data, updated: true }));

    expect(client.cache.get('test')).toEqual({ data: 'value', updated: true });
  });

  it('should register plugins', async () => {
    const plugin = {
      name: 'test-plugin',
      version: '1.0.0',
      install: vi.fn(),
    };

    client.use(plugin as any);

    expect(plugin.install).toHaveBeenCalled();
  });

  it('should destroy client', () => {
    const destroySpy = vi.spyOn(client.getKernel(), 'destroy');
    client.destroy();

    expect(destroySpy).toHaveBeenCalled();
  });
});

describe('createClient', () => {
  it('should create client instance', () => {
    const client = createClient({ baseUrl: 'https://api.com' });
    expect(client).toBeDefined();
    expect(client.cache).toBeDefined();
  });

  it('should create client without config', () => {
    const client = createClient();
    expect(client).toBeDefined();
  });
});
