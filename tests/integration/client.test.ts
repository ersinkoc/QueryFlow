import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient, query, mutation, setQueryContext } from '../../src/index.js';

describe('Client Integration', () => {
  let client: any;

  beforeEach(() => {
    client = createClient({ baseUrl: 'https://api.example.com' });
  });

  afterEach(() => {
    client.destroy();
    setQueryContext(null as any);
  });

  it('should create client and run queries', async () => {
    const q = query('/test');
    expect(q).toBeDefined();
  });

  it('should register plugins', () => {
    expect(client.getKernel()).toBeDefined();
  });

  it('should provide cache API', () => {
    client.cache.set('test', { data: 'value' });
    expect(client.cache.get('test')).toEqual({ data: 'value' });
  });

  it('should handle plugin errors', () => {
    const badPlugin = {
      name: 'bad',
      version: '1.0.0',
      install: () => { throw new Error('Plugin failed'); },
    };

    expect(() => client.use(badPlugin as any)).toThrow('Plugin failed');
  });
});
